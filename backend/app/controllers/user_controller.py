from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User
from app.schemas.user_schema import UserSchema, UserUpdateSchema
from app import db

user_bp = Blueprint('users', __name__)

user_schema = UserSchema()
users_schema = UserSchema(many=True)
user_update_schema = UserUpdateSchema()

@user_bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users (for searching/adding to projects)"""
    search = request.args.get('search', '')
    
    if search:
        users = User.query.filter(
            db.or_(
                User.email.ilike(f'%{search}%'),
                User.first_name.ilike(f'%{search}%'),
                User.last_name.ilike(f'%{search}%')
            )
        ).all()
    else:
        users = User.query.all()
    
    return jsonify({'users': users_schema.dump(users)}), 200

@user_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """Get a specific user"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user_schema.dump(user)}), 200

@user_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user's profile"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        data = user_update_schema.load(request.json)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
    for key, value in data.items():
        setattr(user, key, value)
    
    db.session.commit()
    
    return jsonify({'user': user_schema.dump(user)}), 200
