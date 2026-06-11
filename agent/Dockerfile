# Build from REPO ROOT (not agent/ folder):
#   gcloud run deploy dealpilot-agent --source . --dockerfile agent/Dockerfile

FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY backend/requirements.txt ./backend-requirements.txt
COPY agent/requirements.txt ./agent-requirements.txt
RUN pip install --no-cache-dir -r backend-requirements.txt -r agent-requirements.txt "google-adk>=1.0.0"

COPY backend/mcp_server.py ./backend/mcp_server.py
COPY agent/ ./agent/

WORKDIR /app/agent

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "adk web --port ${PORT:-8080}"]
