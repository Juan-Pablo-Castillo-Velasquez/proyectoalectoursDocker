from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str

    SECRET_KEY: str

    ALGORITHM: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int

    REDIS_URL: str = "redis://redis:6379/0"

    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_FROM_NAME: str
    MAIL_STARTTLS: bool = False
    MAIL_SSL_TLS: bool = False

    class Config:
        env_file = ".env"

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_debe_ser_fuerte(cls, v: str) -> str:
        # El backend NUNCA debe arrancar (ni en dev, ni en producción) con
        # un SECRET_KEY corto: con JWT firmado en HS256, un secret débil se
        # puede forzar por fuerza bruta en segundos y permite falsificar
        # tokens de admin (hallazgo crítico del plan de mejora, Fase 0).
        # Generar uno real con:
        #   python -c "import secrets; print(secrets.token_urlsafe(48))"
        if not v or len(v) < 32:
            raise ValueError(
                "SECRET_KEY es demasiado corta o está vacía (mínimo 32 caracteres). "
                'Genera una real con: python -c "import secrets; print(secrets.token_urlsafe(48))" '
                "y ponla en backend/.env (o en la variable de entorno del hosting real)."
            )
        return v


settings = Settings()
