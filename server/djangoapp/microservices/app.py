from flask import Flask
from nltk.sentiment import SentimentIntensityAnalyzer
import json
import os

app = Flask("Sentiment Analyzer")

sia = SentimentIntensityAnalyzer()


def env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@app.get("/")
def home():
    return "Welcome to the Sentiment Analyzer. \
    Use /analyze/text to get the sentiment"


@app.get("/analyze/<input_txt>")
def analyze_sentiment(input_txt):

    scores = sia.polarity_scores(input_txt)
    print(scores)
    pos = float(scores["pos"])
    neg = float(scores["neg"])
    neu = float(scores["neu"])
    res = "positive"
    print("pos neg nue ", pos, neg, neu)
    if neg > pos and neg > neu:
        res = "negative"
    elif neu > neg and neu > pos:
        res = "neutral"
    res = json.dumps({"sentiment": res})
    print(res)
    return res


if __name__ == "__main__":
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", "5000"))
    app.run(debug=env_bool("FLASK_DEBUG"), host=host, port=port)
