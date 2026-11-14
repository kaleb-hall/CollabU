from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from app.schemas.user_schema import MeSchema, PasswordChangeSchema, UserUpdateSchema
from app.services import user_service
from app.utils.auth import current_user_id
from app.utils.request_data import load_json

user_bp = Blueprint('users', __name__)

me_schema = MeSchema()


@user_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    user = user_service.update_profile(current_user_id(), load_json(UserUpdateSchema()))
    return jsonify({'user': me_schema.dump(user)}), 200


@user_bp.route('/me/password', methods=['PUT'])
@jwt_required()
def change_password():
    data = load_json(PasswordChangeSchema())
    user_service.change_password(current_user_id(), data['current_password'], data['new_password'])
    return '', 204
