from flask_jwt_extended import get_jwt_identity


def current_user_id():
    """The logged-in user's id. JWT identities are stored as strings."""
    return int(get_jwt_identity())
