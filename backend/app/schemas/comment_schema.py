from marshmallow import Schema, fields, pre_load, validate

from app.schemas.fields import UtcDateTime
from app.schemas.user_schema import UserSchema


class CommentSchema(Schema):
    id = fields.Int(dump_only=True)
    task_id = fields.Int(dump_only=True)
    body = fields.Str(dump_only=True)
    created_at = UtcDateTime(dump_only=True)
    author = fields.Nested(UserSchema, dump_only=True)


class CommentCreateSchema(Schema):
    body = fields.Str(required=True, validate=validate.Length(min=1, max=2000))

    @pre_load
    def strip_body(self, data, **kwargs):
        if isinstance(data.get('body'), str):
            data = {**data, 'body': data['body'].strip()}
        return data
