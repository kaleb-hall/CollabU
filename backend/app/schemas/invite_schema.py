from marshmallow import Schema, fields, validate

from app.schemas.fields import UtcDateTime
from app.schemas.project_schema import MEMBER_ROLES


class InviteSchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(dump_only=True)
    email = fields.Str(dump_only=True)
    role = fields.Str(dump_only=True)
    status = fields.Str(dump_only=True)
    created_at = UtcDateTime(dump_only=True)
    expires_at = UtcDateTime(dump_only=True)


class InviteCreateSchema(Schema):
    email = fields.Email(required=True)
    role = fields.Str(validate=validate.OneOf(MEMBER_ROLES), load_default='member')
