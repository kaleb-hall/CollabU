from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app import db
from app.errors import NotFound
from app.models import User
from app.schemas.user_schema import UserSchema, UserUpdateSchema
from app.utils.auth import current_user_id
from app.utils.request_data import load_json

user_bp = Blueprint('users', __name__)

user_schema = UserSchema()
users_schema = UserSchema(many=True)


@user_bp.route('', methods=['GET'])
@jwt_required()
def search_users():
    # Replaced by invite-by-email in phase 2, which removes this list.
    query = User.query
    search = request.args.get('search', '').strip()
    if search:
        pattern = f'%{search}%'
        query = query.filter(db.or_(User.email.ilike(pattern), User.first_name.ilike(pattern), User.last_name.ilike(pattern)))
    return jsonify({'users': users_schema.dump(query.limit(50).all())}), 200


@user_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    user = db.session.get(User, current_user_id())
    if not user:
        raise NotFound('User not found')
    for key, value in load_json(UserUpdateSchema()).items():
        setattr(user, key, value)
    db.session.commit()
    return jsonify({'user': user_schema.dump(user)}), 200
