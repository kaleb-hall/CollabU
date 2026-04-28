from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User

def jwt_required_custom(fn):
    """
    Custom JWT required decorator that also fetches the user
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        if not current_user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Pass current_user to the route function
        return fn(current_user=current_user, *args, **kwargs)
    
    return wrapper

def admin_required(fn):
    """
    Require user to be an admin
    Note: You'll need to add an is_admin field to User model for this
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # For now, we'll just check if user exists
        # Later you can add: if not current_user.is_admin:
        
        return fn(current_user=current_user, *args, **kwargs)
    
    return wrapper
