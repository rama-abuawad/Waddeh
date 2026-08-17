from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Waddeh API"
    app_env: str = "development"
    frontend_origin: str = "http://localhost:3000"
    gemini_api_key: str = ""
    ai_model: str = "gemini-3.6-flash"
    ai_fallback_model: str = "gemini-3.5-flash"
    ai_tts_model: str = "gemini-3.1-flash-tts-preview"
    ai_tts_arabic_voice: str = "Sulafat"
    ai_tts_english_voice: str = "Sulafat"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
