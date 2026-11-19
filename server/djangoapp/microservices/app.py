from flask import Flask, jsonify, request
from nltk.tokenize import sent_tokenize
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import logging
import os

import nltk

app = Flask("Sentiment Analyzer")
logger = logging.getLogger(__name__)

POSITIVE_THRESHOLD = 0.05
NEGATIVE_THRESHOLD = -0.05

analyzer = SentimentIntensityAnalyzer()


def ensure_nltk_tokenizers():
    for resource in ("punkt", "punkt_tab"):
        try:
            nltk.data.find(f"tokenizers/{resource}")
        except LookupError:
            nltk.download(resource, quiet=True)


ensure_nltk_tokenizers()


def env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def compound_score(text):
    """
    VADER compound on the full review text.
    Do not average per-sentence scores — that misclassifies mixed reviews.
    """
    cleaned = (text or "").strip()
    if not cleaned:
        return 0.0
    return analyzer.polarity_scores(cleaned).get("compound", 0.0)


def classify_compound_score(score):
    if score >= POSITIVE_THRESHOLD:
        return "positive"
    if score <= NEGATIVE_THRESHOLD:
        return "negative"
    return "neutral"


def analyze_text(text):
    cleaned = (text or "").strip()
    if not cleaned:
        return "neutral", 0.0, 0

    compound = compound_score(cleaned)
    label = classify_compound_score(compound)
    sentence_count = len([s for s in sent_tokenize(cleaned) if s.strip()])
    return label, compound, sentence_count


@app.get("/")
def home():
    return (
        "Welcome to the Sentiment Analyzer. "
        "Use POST /analyze with JSON {\"text\": \"...\"}."
    )


@app.post("/analyze")
def analyze_sentiment_post():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    label, compound, sentence_count = analyze_text(text)

    logger.info(
        "sentiment=%s compound=%.3f sentences=%s",
        label,
        compound,
        sentence_count,
    )
    return jsonify({"sentiment": label})


@app.get("/analyze/<path:input_txt>")
def analyze_sentiment_get(input_txt):
    """Legacy GET route — prefer POST for long or special-character text."""
    label, compound, sentence_count = analyze_text(input_txt)

    logger.info(
        "sentiment=%s compound=%.3f sentences=%s",
        label,
        compound,
        sentence_count,
    )
    return jsonify({"sentiment": label})


if __name__ == "__main__":
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", "5000"))
    app.run(debug=env_bool("FLASK_DEBUG"), host=host, port=port)
