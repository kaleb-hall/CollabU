import os
import tempfile
from datetime import timedelta

DEV_SECRET = 'dev-only-secret-not-for-production'
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def database_url(default):
    """Read DATABASE_URL, fixing Render's postgres:// prefix for SQLAlchemy."""
    url = os.environ.get('DATABASE_URL', default)
    if url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql://', 1)
    return url


def env_list(key, default=''):
    return [item.strip() for item in os.environ.get(key, default).split(',') if item.strip()]


def env_flag(key, default):
    return os.environ.get(key, str(default)).lower() in ('1', 'true', 'yes')


# Settings each backend needs before the app will start with it
EMAIL_SETTINGS = {'resend': ['RESEND_API_KEY', 'EMAIL_FROM']}
STORAGE_SETTINGS = {'s3': ['S3_ENDPOINT_URL', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']}


class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    REQUIRED_ENV = []
    PRODUCTION = False

    @classmethod
    def load(cls):
        email_backend, storage_backend = cls.email_backend(), cls.storage_backend()
        required = cls.REQUIRED_ENV + EMAIL_SETTINGS.get(email_backend, []) + STORAGE_SETTINGS.get(storage_backend, [])
        missing = [key for key in required if not os.environ.get(key)]
        if missing:
            raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")
        return {
            'SECRET_KEY': os.environ.get('SECRET_KEY', DEV_SECRET),
            'JWT_SECRET_KEY': os.environ.get('JWT_SECRET_KEY', DEV_SECRET),
            'JWT_ACCESS_TOKEN_EXPIRES': timedelta(seconds=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 900))),
            'JWT_REFRESH_TOKEN_EXPIRES': timedelta(days=int(os.environ.get('JWT_REFRESH_TOKEN_EXPIRES_DAYS', 30))),
            'SQLALCHEMY_DATABASE_URI': cls.database_uri(),
            'SQLALCHEMY_TRACK_MODIFICATIONS': cls.SQLALCHEMY_TRACK_MODIFICATIONS,
            'JSON_SORT_KEYS': cls.JSON_SORT_KEYS,
            'CORS_ORIGINS': cls.cors_origins(),
            'TESTING': cls is TestingConfig,
            'PRODUCTION': cls.PRODUCTION,
            'EMAIL_BACKEND': email_backend,
            'EMAIL_FROM': os.environ.get('EMAIL_FROM', 'CollabU <hello@collabu.test>'),
            'RESEND_API_KEY': os.environ.get('RESEND_API_KEY'),
            'FRONTEND_URL': cls.frontend_url(),
            'STORAGE_BACKEND': storage_backend,
            'UPLOAD_FOLDER': cls.upload_folder(),
            'S3_ENDPOINT_URL': os.environ.get('S3_ENDPOINT_URL'),
            'S3_REGION': os.environ.get('S3_REGION', 'us-east-1'),
            'S3_BUCKET': os.environ.get('S3_BUCKET'),
            'S3_ACCESS_KEY_ID': os.environ.get('S3_ACCESS_KEY_ID'),
            'S3_SECRET_ACCESS_KEY': os.environ.get('S3_SECRET_ACCESS_KEY'),
            'DIGEST_TOKEN': os.environ.get('DIGEST_TOKEN'),
            # Login and register limits; memory storage is fine for one server process
            'RATELIMIT_ENABLED': env_flag('RATELIMIT_ENABLED', cls is not TestingConfig),
            'RATELIMIT_STORAGE_URI': os.environ.get('RATELIMIT_STORAGE_URI', 'memory://'),
            'RATELIMIT_HEADERS_ENABLED': True,
            'MAX_UPLOAD_BYTES': MAX_UPLOAD_BYTES,
            # Flask rejects anything bigger before reading it (a little room for form fields)
            'MAX_CONTENT_LENGTH': MAX_UPLOAD_BYTES + 512 * 1024,
        }

    @classmethod
    def upload_folder(cls):
        return os.environ.get('UPLOAD_FOLDER', os.path.join(BACKEND_DIR, 'uploads'))

    @classmethod
    def email_backend(cls):
        return os.environ.get('EMAIL_BACKEND', 'console')

    @classmethod
    def storage_backend(cls):
        return os.environ.get('STORAGE_BACKEND', 'local')

    @classmethod
    def frontend_url(cls):
        return os.environ.get('FRONTEND_URL', 'http://localhost:5173').rstrip('/')

    @classmethod
    def cors_origins(cls):
        return env_list('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')

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

    @classmethod
    def storage_backend(cls):
        return 'local'

    @classmethod
    def upload_folder(cls):
        return tempfile.mkdtemp(prefix='collabu-test-uploads-')


class ProductionConfig(Config):
    REQUIRED_ENV = ['SECRET_KEY', 'JWT_SECRET_KEY', 'DATABASE_URL', 'FRONTEND_URL']
    PRODUCTION = True

    # Real email and cloud files unless told otherwise
    @classmethod
    def email_backend(cls):
        return os.environ.get('EMAIL_BACKEND', 'resend')

    @classmethod
    def storage_backend(cls):
        return os.environ.get('STORAGE_BACKEND', 's3')

    # Only the real frontend may call the API
    @classmethod
    def cors_origins(cls):
        return [cls.frontend_url()]


CONFIGS = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
}


def load_config(name=None):
    name = name or os.environ.get('FLASK_ENV', 'development')
    return CONFIGS[name].load()
