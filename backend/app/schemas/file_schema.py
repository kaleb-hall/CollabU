from marshmallow import Schema, fields

from app.schemas.fields import UtcDateTime
from app.schemas.user_schema import UserSchema


class FileSchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(dump_only=True)
    task_id = fields.Int(dump_only=True)
    filename = fields.Str(dump_only=True)
    content_type = fields.Str(dump_only=True)
    size = fields.Int(dump_only=True)
    created_at = UtcDateTime(dump_only=True)
    uploader = fields.Nested(UserSchema, dump_only=True)


class FileQuerySchema(Schema):
    task_id = fields.Int(load_default=None)
