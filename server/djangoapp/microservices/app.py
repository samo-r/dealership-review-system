from flask import Flask
from nltk.tokenize import sent_tokenize
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import json
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


def average_sentence_compound(text):
    sentences = sent_tokenize(text.strip())
    if not sentences:
        return analyzer.polarity_scores(text.strip()).get("compound", 0.0)

    compounds = [
        analyzer.polarity_scores(sentence).get("compound", 0.0)
        for sentence in sentences
        if sentence.strip()
    ]
    if not compounds:
        return 0.0

    return sum(compounds) / len(compounds)


def classify_compound_score(score):
    if score >= POSITIVE_THRESHOLD:
        return "positive"
    if score <= NEGATIVE_THRESHOLD:
        return "negative"
    return "neutral"


@app.get("/")
def home():
    return (
        "Welcome to the Sentiment Analyzer. "
        "Use /analyze/<text> to get the sentiment."
    )


@app.get("/analyze/<input_txt>")
def analyze_sentiment(input_txt):
    text = (input_txt or "").strip()
    if not text:
        label = "neutral"
        logger.info("sentiment=neutral avg_compound=0.000 sentences=0 (empty input)")
        return json.dumps({"sentiment": label})

    avg_compound = average_sentence_compound(text)
    label = classify_compound_score(avg_compound)
    sentence_count = len(sent_tokenize(text))

    logger.info(
        "sentiment=%s avg_compound=%.3f sentences=%s",
        label,
        avg_compound,
        sentence_count,
    )

    return json.dumps({"sentiment": label})


if __name__ == "__main__":
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", "5000"))
    app.run(debug=env_bool("FLASK_DEBUG"), host=host, port=port)
