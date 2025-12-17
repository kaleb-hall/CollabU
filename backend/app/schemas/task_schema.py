from marshmallow import Schema, fields, validate, validates_schema, ValidationError
from datetime import datetime

class TaskSchema(Schema):
    """Schema for task output"""
    id = fields.Int(dump_only=True)
    project_id = fields.Int(required=True)
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

class TaskCreateSchema(Schema):
    """Schema for creating a task"""
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    due_date = fields.DateTime(required=True)
    start_date = fields.DateTime(allow_none=True)
    estimated_hours = fields.Float(allow_none=True, validate=validate.Range(min=0.5, max=100))
    priority = fields.Str(validate=validate.OneOf(['low', 'medium', 'high', 'urgent']), missing='medium')
    assigned_to = fields.Int(allow_none=True)
    
    @validates_schema
    def validate_dates(self, data, **kwargs):
        """Ensure dates make sense"""
        if data.get('start_date') and data.get('due_date'):
            if data['start_date'] >= data['due_date']:
                raise ValidationError('Start date must be before due date', 'start_date')
        
        if data.get('due_date') and data['due_date'] < datetime.utcnow():
            raise ValidationError('Due date must be in the future', 'due_date')

class TaskUpdateSchema(Schema):
    """Schema for updating a task"""
    title = fields.Str(validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    due_date = fields.DateTime()
    start_date = fields.DateTime(allow_none=True)
    estimated_hours = fields.Float(allow_none=True, validate=validate.Range(min=0.5, max=100))
    priority = fields.Str(validate=validate.OneOf(['low', 'medium', 'high', 'urgent']))
    status = fields.Str(validate=validate.OneOf(['todo', 'in_progress', 'review', 'completed', 'blocked']))
    assigned_to = fields.Int(allow_none=True)
    
    @validates_schema
    def validate_dates(self, data, **kwargs):
        """Ensure dates make sense"""
        if data.get('start_date') and data.get('due_date'):
            if data['start_date'] >= data['due_date']:
                raise ValidationError('Start date must be before due date', 'start_date')

class TaskAssignSchema(Schema):
    """Schema for assigning a task"""
    assigned_to = fields.Int(required=True)

class TaskStatusUpdateSchema(Schema):
    """Schema for updating task status"""
    status = fields.Str(required=True, validate=validate.OneOf(['todo', 'in_progress', 'review', 'completed', 'blocked']))
