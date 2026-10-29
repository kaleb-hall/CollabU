from flask_jwt_extended import create_access_token

from app import db
from app.errors import Conflict, Unauthorized
from app.models import User


def find_by_email(email):
    return User.query.filter(db.func.lower(User.email) == email.strip().lower()).first()


def register_user(data):
    if find_by_email(data['email']):
        raise Conflict('That email is already registered')
    user = User(email=data['email'].strip().lower(), first_name=data['first_name'], last_name=data['last_name'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return user


def authenticate(email, password):
    user = find_by_email(email)
    if not user or not user.check_password(password):
        raise Unauthorized('Wrong email or password')
    if not user.is_active:
        raise Unauthorized('This account is deactivated')
    return user


def access_token_for(user):
    return create_access_token(identity=str(user.id))
