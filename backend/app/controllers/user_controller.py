from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.errors import NotFound
from app.models import User
from app.schemas.user_schema import UserSchema, UserUpdateSchema
from app.utils.auth import current_user_id
from app.utils.request_data import load_json

user_bp = Blueprint('users', __name__)

user_schema = UserSchema()


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
