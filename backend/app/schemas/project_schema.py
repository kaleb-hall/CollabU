from marshmallow import Schema, fields, validate, validates_schema, ValidationError, EXCLUDE
from datetime import datetime

class ProjectMemberSchema(Schema):
    """Schema for project member output"""
    id = fields.Int(dump_only=True)
    project_id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    role = fields.Str(dump_only=True)
    joined_at = fields.DateTime(dump_only=True)
    user = fields.Nested('UserSchema', dump_only=True, exclude=('bio', 'avatar_url'))

class ProjectSchema(Schema):
    """Schema for project output"""
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    description = fields.Str(allow_none=True)
    deadline = fields.DateTime(required=True)
    status = fields.Str(dump_only=True)
    created_by = fields.Int(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    owner = fields.Nested('UserSchema', dump_only=True, exclude=('bio', 'avatar_url'))
    members = fields.Nested(ProjectMemberSchema, many=True, dump_only=True)
    tasks = fields.Nested('TaskSchema', many=True, dump_only=True)

class ProjectCreateSchema(Schema):
    """Schema for creating a project"""
    class Meta:
        unknown = EXCLUDE

    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    deadline = fields.DateTime(required=True)
    
    @validates_schema
    def validate_deadline(self, data, **kwargs):
        """Ensure deadline is in the future"""
        if data.get('deadline'):
            # Make deadline timezone-naive for comparison
            deadline = data['deadline']
            if deadline.tzinfo is not None:
                deadline = deadline.replace(tzinfo=None)
            
            now = datetime.utcnow()
            
            if deadline < now:
                raise ValidationError('Deadline must be in the future', 'deadline')

class ProjectUpdateSchema(Schema):
    """Schema for updating a project"""
    title = fields.Str(validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    deadline = fields.DateTime()
    status = fields.Str(validate=validate.OneOf(['active', 'completed', 'archived', 'on_hold']))
    
    @validates_schema
    def validate_deadline(self, data, **kwargs):
        """Ensure deadline is in the future"""
        if data.get('deadline'):
            # Make deadline timezone-naive for comparison
            deadline = data['deadline']
            if deadline.tzinfo is not None:
                deadline = deadline.replace(tzinfo=None)
            
            now = datetime.utcnow()
            
            if deadline < now:
                raise ValidationError('Deadline must be in the future', 'deadline')

class AddMemberSchema(Schema):
    """Schema for adding a member to a project"""
    user_id = fields.Int(required=True)
    role = fields.Str(validate=validate.OneOf(['admin', 'member', 'viewer']), missing='member')

