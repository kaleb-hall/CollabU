from marshmallow import Schema, fields, validate, validates, ValidationError

class UserSchema(Schema):
    """Schema for user output"""
    id = fields.Int(dump_only=True)
    email = fields.Email(required=True)
    first_name = fields.Str(required=True)
    last_name = fields.Str(required=True)
    full_name = fields.Str(dump_only=True)
    bio = fields.Str(allow_none=True)
    avatar_url = fields.Str(allow_none=True)
    is_active = fields.Bool(dump_only=True)
    email_verified = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class UserRegistrationSchema(Schema):
    """Schema for user registration"""
    email = fields.Email(required=True, validate=validate.Length(max=120))
    password = fields.Str(required=True, validate=validate.Length(min=8, max=128), load_only=True)
    first_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    last_name = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    
    @validates('password')
    def validate_password(self, value):
        """Ensure password meets requirements"""
        if not any(char.isdigit() for char in value):
            raise ValidationError('Password must contain at least one number')
        if not any(char.isupper() for char in value):
            raise ValidationError('Password must contain at least one uppercase letter')

class UserLoginSchema(Schema):
    """Schema for user login"""
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)

class UserUpdateSchema(Schema):
    """Schema for updating user profile"""
    first_name = fields.Str(validate=validate.Length(min=1, max=50))
    last_name = fields.Str(validate=validate.Length(min=1, max=50))
    bio = fields.Str(allow_none=True)
    avatar_url = fields.Str(allow_none=True)
