"""
Configuration settings for AFTERMATH backend.
"""
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


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
    DATABASE_URL: str = "sqlite+aiosqlite:///./aftermath.db"

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

    # GitLab Duo & DevSecOps Platform Integration
    GITLAB_INSTANCE_URL: str = "https://gitlab.com"
    GITLAB_PROJECT_PATH: str = "atumanyire/aftermath"
    GITLAB_ACCESS_TOKEN: str = ""
    GITLAB_DUO_ENABLED: bool = False

    # Synthetic Payment Service Sandbox
    SYNTHETIC_PAYMENT_LATENCY_MS: int = 120
    SYNTHETIC_PAYMENT_FAILURE_INJECTION: bool = False


settings = Settings()
