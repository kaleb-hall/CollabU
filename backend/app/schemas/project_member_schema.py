from marshmallow import Schema, fields

class ProjectMemberSchema(Schema):
    """Schema for project member output"""
    id = fields.Int(dump_only=True)
    project_id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    user = fields.Nested('UserSchema', dump_only=True, exclude=('bio', 'avatar_url'))
    role = fields.Str(dump_only=True)
    joined_at = fields.DateTime(dump_only=True)
