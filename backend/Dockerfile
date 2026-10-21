FROM python:3.11-slim-bookworm

WORKDIR /app

# Upgrade pip and install python dependencies with generous network timeout
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --default-timeout=120 -r requirements.txt

# Copy source code
COPY . .

# Run alembic migrations and start server
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
