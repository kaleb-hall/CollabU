import os
from datetime import timedelta

class Config:
    """Base configuration with security-first approach"""
    
    # Security - NEVER use weak fallbacks in production
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        # Only for development - generates new key each restart
        import secrets
        SECRET_KEY = secrets.token_hex(32)
        print("⚠️  WARNING: Using generated SECRET_KEY. Set SECRET_KEY in .env for production!")
    
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    if not JWT_SECRET_KEY:
        # Only for development - generates new key each restart
        import secrets
        JWT_SECRET_KEY = secrets.token_hex(32)
        print("⚠️  WARNING: Using generated JWT_SECRET_KEY. Set JWT_SECRET_KEY in .env for production!")
    
    # Database - use environment variable
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://localhost/collabu_dev'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Config
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 3600))
    )
    
    # Additional security headers
    JSON_SORT_KEYS = False

class DevelopmentConfig(Config):
    """Development-specific settings"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Production-specific settings"""
    DEBUG = False
    TESTING = False
    
    @classmethod
    def validate(cls):
        """Ensure required production configs are set"""
        required = ['SECRET_KEY', 'JWT_SECRET_KEY', 'DATABASE_URL']
        missing = [key for key in required if not os.environ.get(key)]
        if missing:
            raise ValueError(f"Production requires: {', '.join(missing)}")

class TestingConfig(Config):
    """Testing-specific settings"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
