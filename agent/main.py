import os

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from google.adk.cli.fast_api import get_fast_api_app

load_dotenv(os.path.join(os.path.dirname(__file__), "dealpilot", ".env"))

AGENT_DIR = os.path.dirname(os.path.abspath(__file__))

_allowed = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [origin.strip() for origin in _allowed.split(",") if origin.strip()]

app: FastAPI = get_fast_api_app(
    agents_dir=AGENT_DIR,
    allow_origins=ALLOWED_ORIGINS,
    web=os.getenv("SERVE_WEB_INTERFACE", "false").lower() == "true",
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
