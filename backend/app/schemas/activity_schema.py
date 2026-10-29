from marshmallow import Schema, fields

from app.schemas.fields import UtcDateTime
from app.schemas.user_schema import UserSchema


class ActivitySchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(dump_only=True)
    action = fields.Str(dump_only=True)
    target_type = fields.Str(dump_only=True)
    target_id = fields.Int(dump_only=True)
    description = fields.Str(dump_only=True)
    created_at = UtcDateTime(dump_only=True)
    user = fields.Nested(UserSchema, dump_only=True)
