from flask_jwt_extended import create_access_token, create_refresh_token

from app import db
from app.errors import Conflict, Unauthorized
from app.models import User
from app.utils.time import is_valid_timezone


def find_by_email(email):
    return User.query.filter(db.func.lower(User.email) == email.strip().lower()).first()


def register_user(data):
    if find_by_email(data['email']):
        raise Conflict('That email is already registered')
    user = User(email=data['email'].strip().lower(), first_name=data['first_name'], last_name=data['last_name'])
    user.set_password(data['password'])
    remember_timezone(user, data.get('timezone'))
    db.session.add(user)
    db.session.commit()
    return user


def remember_timezone(user, timezone_name):
    """Store the browser's timezone so emails and schedules use local time. Bad values are ignored."""
    if timezone_name and is_valid_timezone(timezone_name):
        user.timezone = timezone_name


def authenticate(email, password, timezone_name=None):
    user = find_by_email(email)
    if not user or not user.check_password(password):
        raise Unauthorized('Wrong email or password')
    if not user.is_active:
        raise Unauthorized('This account is deactivated')
    remember_timezone(user, timezone_name)
    db.session.commit()
    return user


def access_token_for(user):
    return create_access_token(identity=str(user.id))


def refresh_token_for(user):
    return create_refresh_token(identity=str(user.id))
