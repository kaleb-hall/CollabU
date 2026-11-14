from marshmallow import Schema, fields

from app.schemas.fields import UtcDateTime


class NotificationSchema(Schema):
    id = fields.Int(dump_only=True)
    type = fields.Str(dump_only=True)
    title = fields.Str(dump_only=True)
    message = fields.Str(dump_only=True)
    link = fields.Str(dump_only=True)
    read = fields.Bool(dump_only=True)
    created_at = UtcDateTime(dump_only=True)
