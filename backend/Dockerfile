FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libglib2.0-0 libgl1 fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt backend/requirements-vision.txt ./backend/
ARG WITH_VISION=false
RUN pip install --no-cache-dir -r backend/requirements.txt && if [ "$WITH_VISION" = "true" ]; then pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu && pip install --no-cache-dir -r backend/requirements-vision.txt; fi
COPY backend ./backend
RUN useradd -m qala && chown -R qala:qala /app
USER qala
EXPOSE 8000
CMD ["uvicorn","backend.app.main:app","--host","0.0.0.0","--port","8000"]
