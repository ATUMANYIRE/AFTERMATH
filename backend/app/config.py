"""
Configuration settings for AFTERMATH backend.
"""
from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json

_BASE_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_DB_FILE = (_BASE_DIR / "aftermath.db").as_posix()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "info"

    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    API_PREFIX: str = "/api/v1"

    # SQLite for zero-dep local quickstart, or PostgreSQL for production / Docker Compose
    DATABASE_URL: str = f"sqlite+aiosqlite:///{_DEFAULT_DB_FILE}"

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Access boundary for POST/PUT/PATCH/DELETE (see app/security.py). Empty = loopback-only.
    WRITE_API_KEY: str = ""

    # GitLab Duo & DevSecOps Platform Integration
    GITLAB_INSTANCE_URL: str = "https://gitlab.com"
    GITLAB_PROJECT_PATH: str = "atumanyire-labs/aftermath"
    GITLAB_ACCESS_TOKEN: str = ""
    GITLAB_DUO_ENABLED: bool = False

    # Synthetic Payment Service Sandbox
    SYNTHETIC_PAYMENT_LATENCY_MS: int = 120
    SYNTHETIC_PAYMENT_FAILURE_INJECTION: bool = False


settings = Settings()
