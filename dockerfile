FROM python:3.10-slim

WORKDIR /code
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt
COPY ./app /code/app
EXPOSE 7000
CMD ["fastapi", "run", "--port", "7000", "--workers", "5", "app/main.py"]