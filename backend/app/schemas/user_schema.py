import re

from marshmallow import EXCLUDE, Schema, ValidationError, fields, validate

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


class MeSchema(UserSchema):
    """The logged-in user's own profile, including private settings."""
    email_notifications = fields.Bool(dump_only=True)
    timezone = fields.Str(dump_only=True)


def check_password_strength(value):
    if len(value) < 8:
        raise ValidationError('Password must be at least 8 characters')
    if not re.search(r'[A-Z]', value):
        raise ValidationError('Password must contain at least one uppercase letter')
    if not re.search(r'[0-9]', value):
        raise ValidationError('Password must contain at least one number')


class UserRegisterSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=[validate.Length(max=128), check_password_strength])
    first_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    last_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    timezone = fields.Str(load_default=None)


class UserLoginSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    email = fields.Email(required=True)
    password = fields.Str(required=True)
    timezone = fields.Str(load_default=None)


class UserUpdateSchema(Schema):
    first_name = fields.Str(validate=validate.Length(min=1, max=50))
    last_name = fields.Str(validate=validate.Length(min=1, max=50))
    email_notifications = fields.Bool()


class PasswordChangeSchema(Schema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True, validate=[validate.Length(max=128), check_password_strength])
