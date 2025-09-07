from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Accounting for Dummies API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "A comprehensive accounting management system"
    API_V1_STR: str = "/api/v1"
    
    # CORS - will be parsed from comma-separated string
    BACKEND_CORS_ORIGINS_STR: str = "http://localhost:3000,http://localhost:8000"
    
    # Database - PostgreSQL
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/accounting_db"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS_STR: str = "jpg,jpeg,png,pdf,doc,docx"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS_STR.split(",")]
    
    @property
    def ALLOWED_EXTENSIONS(self) -> List[str]:
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS_STR.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
