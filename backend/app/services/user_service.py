from app import db
from app.errors import NotFound, ValidationFailed
from app.models import User


def get_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        raise NotFound('User not found')
    return user


def update_profile(user_id, data):
    user = get_user(user_id)
    for key, value in data.items():
        setattr(user, key, value)
    db.session.commit()
    return user


def change_password(user_id, current_password, new_password):
    user = get_user(user_id)
    if not user.check_password(current_password):
        raise ValidationFailed(details={'current_password': ['That is not your current password']})
    user.set_password(new_password)
    db.session.commit()
