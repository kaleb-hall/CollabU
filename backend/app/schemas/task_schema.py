from marshmallow import Schema, fields

class TaskSchema(Schema):
    """Schema for task output"""
    id = fields.Int(dump_only=True)
    project_id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    description = fields.Str(allow_none=True)
    start_date = fields.DateTime(allow_none=True)
    due_date = fields.DateTime(required=True)
    estimated_hours = fields.Float(allow_none=True)
    priority = fields.Str(dump_only=True)
    status = fields.Str(dump_only=True)
    assigned_to = fields.Int(allow_none=True)
    assignee = fields.Nested('UserSchema', dump_only=True, exclude=('bio', 'avatar_url'))
    completed_at = fields.DateTime(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
