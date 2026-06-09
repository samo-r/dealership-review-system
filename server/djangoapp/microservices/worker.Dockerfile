FROM python:3.11-slim-bookworm

WORKDIR /worker

COPY requirements.txt requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

COPY sentiment_worker.py sentiment_worker.py

CMD ["python3", "sentiment_worker.py"]
