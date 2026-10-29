import os
from datetime import timedelta

DEV_SECRET = 'dev-only-secret-not-for-production'


def database_url(default):
    """Read DATABASE_URL, fixing Render's postgres:// prefix for SQLAlchemy."""
    url = os.environ.get('DATABASE_URL', default)
    if url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql://', 1)
    return url


def cors_origins():
    raw = os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')
    return [origin.strip() for origin in raw.split(',') if origin.strip()]


class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    REQUIRED_ENV = []

    @classmethod
    def load(cls):
        missing = [key for key in cls.REQUIRED_ENV if not os.environ.get(key)]
        if missing:
            raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")
        return {
            'SECRET_KEY': os.environ.get('SECRET_KEY', DEV_SECRET),
            'JWT_SECRET_KEY': os.environ.get('JWT_SECRET_KEY', DEV_SECRET),
            'JWT_ACCESS_TOKEN_EXPIRES': timedelta(seconds=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 3600))),
            'SQLALCHEMY_DATABASE_URI': cls.database_uri(),
            'SQLALCHEMY_TRACK_MODIFICATIONS': cls.SQLALCHEMY_TRACK_MODIFICATIONS,
            'JSON_SORT_KEYS': cls.JSON_SORT_KEYS,
            'CORS_ORIGINS': cors_origins(),
            'TESTING': cls is TestingConfig,
            'EMAIL_BACKEND': cls.email_backend(),
            'FRONTEND_URL': os.environ.get('FRONTEND_URL', 'http://localhost:5173'),
        }

    @classmethod
    def email_backend(cls):
        return os.environ.get('EMAIL_BACKEND', 'console')

    @classmethod
    def database_uri(cls):
        return database_url('sqlite:///collabu_dev.db')


class DevelopmentConfig(Config):
    pass


class TestingConfig(Config):
    @classmethod
    def database_uri(cls):
        return 'sqlite:///:memory:'

    @classmethod
    def email_backend(cls):
        return 'memory'


class ProductionConfig(Config):
    REQUIRED_ENV = ['SECRET_KEY', 'JWT_SECRET_KEY', 'DATABASE_URL']


CONFIGS = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
}


def load_config(name=None):
    name = name or os.environ.get('FLASK_ENV', 'development')
    return CONFIGS[name].load()
