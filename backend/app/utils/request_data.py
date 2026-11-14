from flask import request

from app.errors import ValidationFailed


def load_json(schema):
    """Validate the JSON request body with a marshmallow schema."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValidationFailed('Request body must be a JSON object')
    return schema.load(data)
