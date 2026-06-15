"""
Background worker: consumes review sentiment events from Redis,
calls the Flask VADER service, and persists results via the Node API.
"""

import json
import logging
import os
import sys
import time
from urllib.parse import quote

import requests
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
for env_path in (
    os.path.join(BASE_DIR, "..", "..", ".env"),
    os.path.join(BASE_DIR, "..", "..", "database", ".env"),
    os.path.join(BASE_DIR, ".env"),
):
    if os.path.isfile(env_path):
        load_dotenv(env_path, override=False)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [sentiment-worker] %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)


def require_env(name):
    value = os.getenv(name)
    if not value or not str(value).strip():
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value.strip()


REDIS_URL = require_env("REDIS_URL")
SENTIMENT_QUEUE_NAME = os.getenv("SENTIMENT_QUEUE_NAME", "review_sentiment_queue").strip()
BACKEND_URL = require_env("backend_url").rstrip("/")
SENTIMENT_ANALYZER_URL = require_env("sentiment_analyzer_url").rstrip("/")
INTERNAL_API_KEY = require_env("INTERNAL_API_KEY")

REQUEST_TIMEOUT = int(os.getenv("SENTIMENT_WORKER_TIMEOUT", "10"))
MAX_RETRIES = int(os.getenv("SENTIMENT_WORKER_MAX_RETRIES", "3"))
RETRY_BACKOFF_SECONDS = [2, 5, 10]
BLPOP_TIMEOUT = int(os.getenv("SENTIMENT_WORKER_BLPOP_TIMEOUT", "5"))


def _redis_target_label(url):
    if "upstash.io" in url:
        return "Upstash Redis"
    if url.startswith("rediss://"):
        return "TLS Redis"
    return "Redis"


def verify_dependencies():
    import redis

    label = _redis_target_label(REDIS_URL)
    try:
        client = redis.from_url(REDIS_URL, decode_responses=True)
        client.ping()
        logger.info("Connected to %s.", label)
    except Exception as err:
        logger.error(
            "Failed to connect to %s — %s. "
            "Verify REDIS_URL (use rediss:// for Upstash) and credentials.",
            label,
            err,
        )
        raise SystemExit(1) from err

    for name, url, path in (
        ("Node API", BACKEND_URL, "/health"),
        ("Sentiment analyzer", SENTIMENT_ANALYZER_URL, "/"),
    ):
        try:
            requests.get(f"{url}{path}", timeout=REQUEST_TIMEOUT)
        except Exception as err:
            logger.warning("%s unreachable at %s — %s", name, url, err)


def analyze_text(text):
    encoded_text = quote(text, safe="")
    request_url = f"{SENTIMENT_ANALYZER_URL}/analyze/{encoded_text}"
    response = requests.get(request_url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    payload = response.json()
    sentiment = payload.get("sentiment")
    if sentiment not in {"positive", "neutral", "negative"}:
        raise ValueError(f"Unexpected sentiment label: {sentiment}")
    return sentiment


def patch_review_sentiment(review_id, sentiment, status, error_message=None):
    request_url = f"{BACKEND_URL}/updateReview/{review_id}/sentiment"
    body = {
        "sentiment": sentiment,
        "sentiment_status": status,
        "sentiment_analyzed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "sentiment_error": error_message,
    }
    response = requests.patch(
        request_url,
        json=body,
        headers={"x-internal-api-key": INTERNAL_API_KEY},
        timeout=REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    return response.json()


def process_event(event):
    review_id = event.get("review_id")
    text = event.get("text", "")
    event_type = event.get("event", "review.created")

    if not review_id or not text:
        logger.warning("Skipping malformed event: %s", event)
        return

    logger.info("Processing %s for review_id=%s", event_type, review_id)

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            sentiment = analyze_text(text)
            patch_review_sentiment(review_id, sentiment, "completed", None)
            logger.info(
                "[sentiment] review_id=%s status=COMPLETED label=%s (worker)",
                review_id,
                sentiment,
            )
            return
        except Exception as err:
            last_error = str(err)
            logger.warning(
                "Attempt %s/%s failed for review %s: %s",
                attempt + 1,
                MAX_RETRIES,
                review_id,
                last_error,
            )
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_BACKOFF_SECONDS[min(attempt, len(RETRY_BACKOFF_SECONDS) - 1)])

    try:
        patch_review_sentiment(review_id, None, "failed", last_error)
        logger.warning(
            "[sentiment] review_id=%s status=FAILED (worker) %s",
            review_id,
            last_error,
        )
    except Exception as err:
        logger.error("[sentiment] review_id=%s status=FAILED persist-error=%s", review_id, err)


def run_worker():
    import redis

    verify_dependencies()

    client = redis.from_url(REDIS_URL, decode_responses=True)
    logger.info(
        "Sentiment worker started. Queue=%s Redis=%s",
        SENTIMENT_QUEUE_NAME,
        _redis_target_label(REDIS_URL),
    )

    while True:
        try:
            item = client.blpop(SENTIMENT_QUEUE_NAME, timeout=BLPOP_TIMEOUT)
            if not item:
                continue

            _, raw_payload = item
            event = json.loads(raw_payload)
            process_event(event)
        except KeyboardInterrupt:
            logger.info("Sentiment worker shutting down.")
            sys.exit(0)
        except Exception as err:
            logger.exception("Worker loop error: %s", err)
            time.sleep(2)


if __name__ == "__main__":
    run_worker()
