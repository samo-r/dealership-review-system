import json
import logging
import os

from .sentiment_logging import (
    log_sentiment_queue_skipped,
    log_sentiment_queued,
)

logger = logging.getLogger(__name__)

SENTIMENT_QUEUE_NAME = os.getenv(
    "SENTIMENT_QUEUE_NAME", "review_sentiment_queue").strip()
REDIS_URL = os.getenv("REDIS_URL", "").strip()


def _redis_target_label(url):
    if "upstash.io" in url:
        return "Upstash Redis"
    if url.startswith("rediss://"):
        return "TLS Redis"
    return "Redis"


def _get_redis_client():
    if not REDIS_URL:
        return None

    import redis

    return redis.from_url(REDIS_URL, decode_responses=True)


def verify_redis_connection():
    """
    Optional startup check — logs connectivity to Upstash/local Redis.
    Returns True when a ping succeeds, False when Redis is unavailable.
    """
    if not REDIS_URL:
        logger.warning(
            "[redis] REDIS_URL is not set — "
            "sentiment queue publishing is disabled.",
        )
        return False

    label = _redis_target_label(REDIS_URL)
    try:
        client = _get_redis_client()
        client.ping()
        logger.info("[redis] Connected to %s.", label)
        return True
    except Exception as err:
        logger.error(
            "[redis] Failed to connect to %s — %s. "
            "Check REDIS_URL (use rediss:// for Upstash), token, and TLS.",
            label,
            err,
        )
        return False


def publish_review_sentiment_event(event_type, review_id, text):
    """
    Enqueue a review for asynchronous sentiment analysis.
    Returns True when queued, False when skipped or Redis unavailable.
    """
    if not review_id or not text or not str(text).strip():
        return False

    client = _get_redis_client()
    if client is None:
        log_sentiment_queue_skipped(review_id, "REDIS_URL not configured")
        return False

    payload = {
        "event": event_type,
        "review_id": int(review_id),
        "text": str(text),
    }

    try:
        client.rpush(SENTIMENT_QUEUE_NAME, json.dumps(payload))
        log_sentiment_queued(review_id, event_type)
        return True
    except Exception as err:
        log_sentiment_queue_skipped(review_id, f"publish error: {err}")
        return False
