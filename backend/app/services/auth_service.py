from app import db
from app.models.user import User
from flask_jwt_extended import create_access_token, create_refresh_token
from datetime import timedelta

class AuthService:
    
    @staticmethod
    def register_user(data):
        """
        Register a new user
        Returns: (user, error)
        """
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return None, {'message': 'Email already registered', 'code': 'EMAIL_EXISTS'}
        
        # Create new user
        user = User(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        user.set_password(data['password'])
        
        try:
            db.session.add(user)
            db.session.commit()
            return user, None
        except Exception as e:
            db.session.rollback()
            return None, {'message': 'Error creating user', 'code': 'DATABASE_ERROR', 'details': str(e)}
    
    @staticmethod
    def authenticate_user(email, password):
        """
        Authenticate user credentials
        Returns: (user, error)
        """
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return None, {'message': 'Invalid email or password', 'code': 'INVALID_CREDENTIALS'}
        
        if not user.check_password(password):
            return None, {'message': 'Invalid email or password', 'code': 'INVALID_CREDENTIALS'}
        
        if not user.is_active:
            return None, {'message': 'Account is deactivated', 'code': 'ACCOUNT_INACTIVE'}
        
        return user, None
    
    @staticmethod
    def generate_tokens(user_id):
        """
        Generate JWT access and refresh tokens
        Returns: dict with access_token and refresh_token
        """
        # Convert user_id to string for JWT subject
        access_token = create_access_token(
            identity=str(user_id),
            expires_delta=timedelta(hours=1)
        )
        refresh_token = create_refresh_token(
            identity=str(user_id),
            expires_delta=timedelta(days=30)
        )
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token
        }
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        return User.query.get(int(user_id))
