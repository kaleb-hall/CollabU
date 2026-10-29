from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.errors import NotFound
from app.models import User
from app.schemas.user_schema import MeSchema, UserLoginSchema, UserRegisterSchema
from app.services import auth_service
from app.utils.auth import current_user_id
from app.utils.request_data import load_json

auth_bp = Blueprint('auth', __name__)

user_schema = MeSchema()


def auth_response(user, status):
    return jsonify({'user': user_schema.dump(user), 'access_token': auth_service.access_token_for(user)}), status


@auth_bp.route('/register', methods=['POST'])
def register():
    user = auth_service.register_user(load_json(UserRegisterSchema()))
    return auth_response(user, 201)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = load_json(UserLoginSchema())
    return auth_response(auth_service.authenticate(data['email'], data['password'], data['timezone']), 200)


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user = db.session.get(User, current_user_id())
    if not user:
        raise NotFound('User not found')
    return jsonify({'user': user_schema.dump(user)}), 200
