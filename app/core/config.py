from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    database_url: str = "postgresql://docref:docref@localhost:5432/docref_db"

    # Storage
    storage_base_path: str = "./storage"
    upload_dir: str = "./storage/uploads"
    export_dir: str = "./storage/exports"

    # App
    app_env: str = "development"
    log_level: str = "INFO"

    @property
    def upload_path(self) -> Path:
        return Path(self.upload_dir)

    @property
    def export_path(self) -> Path:
        return Path(self.export_dir)


settings = Settings()
