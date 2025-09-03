from pydantic_settings import BaseSettings
from functools import lru_cache
import os
import secrets

class Settings(BaseSettings):
    TELEGRAM_BOT_TOKEN: str | None = None
    JWT_SECRET: str = secrets.token_hex(32)
    JWT_EXPIRE_MINUTES: int = 60 * 24
    PROJECT_NAME: str = "NutriAI API"
    ALLOW_ORIGINS: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache
def get_settings() -> Settings:
    return Settings()
