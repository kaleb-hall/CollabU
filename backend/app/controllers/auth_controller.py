from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import ValidationError
from app.services.auth_service import AuthService
from app.schemas.user_schema import UserSchema, UserRegistrationSchema, UserLoginSchema

auth_bp = Blueprint('auth', __name__)

# Initialize schemas
user_schema = UserSchema()
registration_schema = UserRegistrationSchema()
login_schema = UserLoginSchema()

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user
    POST /api/auth/register
    Body: { "email": "...", "password": "...", "first_name": "...", "last_name": "..." }
    """
    try:
        # Validate request data
        data = registration_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400
    
    # Register user
    user, error = AuthService.register_user(data)
    
    if error:
        status_code = 409 if error['code'] == 'EMAIL_EXISTS' else 500
        return jsonify({'error': error['message']}), status_code
    
    # Generate tokens
    tokens = AuthService.generate_tokens(user.id)
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user_schema.dump(user),
        'access_token': tokens['access_token'],
        'refresh_token': tokens['refresh_token']
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user
    POST /api/auth/login
    Body: { "email": "...", "password": "..." }
    """
    try:
        # Validate request data
        data = login_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400
    
    # Authenticate user
    user, error = AuthService.authenticate_user(data['email'], data['password'])
    
    if error:
        return jsonify({'error': error['message']}), 401
    
    # Generate tokens
    tokens = AuthService.generate_tokens(user.id)
    
    return jsonify({
        'message': 'Login successful',
        'user': user_schema.dump(user),
        'access_token': tokens['access_token'],
        'refresh_token': tokens['refresh_token']
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token
    POST /api/auth/refresh
    Headers: { "Authorization": "Bearer <refresh_token>" }
    """
    current_user_id = get_jwt_identity()
    tokens = AuthService.generate_tokens(int(current_user_id))
    
    return jsonify({
        'access_token': tokens['access_token']
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current authenticated user
    GET /api/auth/me
    Headers: { "Authorization": "Bearer <access_token>" }
    """
    current_user_id = get_jwt_identity()
    user = AuthService.get_user_by_id(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': user_schema.dump(user)
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout user (client should delete tokens)
    POST /api/auth/logout
    Headers: { "Authorization": "Bearer <access_token>" }
    """
    jti = get_jwt()['jti']  # JWT ID - unique identifier for the token
    
    return jsonify({
        'message': 'Logout successful'
    }), 200
