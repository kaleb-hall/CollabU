import re

from marshmallow import EXCLUDE, Schema, ValidationError, fields, validate, validates

from app.schemas.fields import UtcDateTime


class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    email = fields.Email(dump_only=True)
    first_name = fields.Str(dump_only=True)
    last_name = fields.Str(dump_only=True)
    full_name = fields.Method('get_full_name', dump_only=True)
    created_at = UtcDateTime(dump_only=True)

    def get_full_name(self, user):
        return f'{user.first_name} {user.last_name}'


class UserRegisterSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8, max=128))
    first_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    last_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    timezone = fields.Str(load_default=None)

    @validates('password')
    def validate_password(self, value, **kwargs):
        if not re.search(r'[A-Z]', value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not re.search(r'[0-9]', value):
            raise ValidationError('Password must contain at least one number')


class UserLoginSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Email(required=True)
    password = fields.Str(required=True)
    timezone = fields.Str(load_default=None)


class UserUpdateSchema(Schema):
    first_name = fields.Str(validate=validate.Length(min=1, max=50))
    last_name = fields.Str(validate=validate.Length(min=1, max=50))
