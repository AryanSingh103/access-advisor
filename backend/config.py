import os
import pathlib
from dotenv import load_dotenv

# Try local .env first, then fall back to repo-root .env
_backend_env = pathlib.Path(__file__).parent / ".env"
_root_env = pathlib.Path(__file__).parent.parent / ".env"
load_dotenv(_backend_env if _backend_env.exists() else _root_env)


class Settings:
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")


settings = Settings()
