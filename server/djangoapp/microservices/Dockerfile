FROM python:3.9.18-slim-bookworm

WORKDIR /python-docker

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt \
    && python3 -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab')"

COPY . .

ENV FLASK_APP=app.py

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"]
