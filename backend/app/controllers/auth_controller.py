from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import User
from app.schemas.user_schema import UserSchema, UserRegisterSchema, UserLoginSchema
from app import db

auth_bp = Blueprint('auth', __name__)

user_schema = UserSchema()
user_register_schema = UserRegisterSchema()
user_login_schema = UserLoginSchema()

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = user_register_schema.load(request.json)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    # Create new user
    user = User(
        email=data['email'],
        first_name=data['first_name'],
        last_name=data['last_name']
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Create access token with user_id as STRING
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'user': user_schema.dump(user),
        'access_token': access_token
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = user_login_schema.load(request.json)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
    # Find user
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Create access token with user_id as STRING
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'user': user_schema.dump(user),
        'access_token': access_token
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    current_user_id = int(get_jwt_identity())  # Convert back to int
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user_schema.dump(user)}), 200
