from marshmallow import Schema, ValidationError, fields, validate, validates_schema

from app.schemas.fields import UtcDateTime
from app.schemas.user_schema import UserSchema

TASK_STATUSES = ['todo', 'in_progress', 'review', 'blocked', 'completed']
TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent']


class TaskSchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(dump_only=True)
    title = fields.Str(dump_only=True)
    description = fields.Str(dump_only=True)
    start_date = UtcDateTime(dump_only=True)
    due_date = UtcDateTime(dump_only=True)
    estimated_hours = fields.Float(dump_only=True)
    priority = fields.Str(dump_only=True)
    status = fields.Str(dump_only=True)
    assigned_to = fields.Int(dump_only=True)
    assignee = fields.Nested(UserSchema, dump_only=True)
    completed_at = UtcDateTime(dump_only=True)
    created_at = UtcDateTime(dump_only=True)
    updated_at = UtcDateTime(dump_only=True)


class MyTaskSchema(TaskSchema):
    """A task plus the title of its project, for lists that mix projects."""
    project = fields.Nested('ProjectSummarySchema', dump_only=True)


class ProjectSummarySchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(dump_only=True)


class TaskInputSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    due_date = UtcDateTime()
    start_date = UtcDateTime(allow_none=True)
    estimated_hours = fields.Float(allow_none=True, validate=validate.Range(min=0.25, max=200))
    priority = fields.Str(validate=validate.OneOf(TASK_PRIORITIES))
    status = fields.Str(validate=validate.OneOf(TASK_STATUSES))
    assigned_to = fields.Int(allow_none=True)

    @validates_schema
    def validate_dates(self, data, **kwargs):
        start, due = data.get('start_date'), data.get('due_date')
        if start and due and start >= due:
            raise ValidationError('Start date must be before due date', 'start_date')


class TaskCreateSchema(TaskInputSchema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    due_date = UtcDateTime(required=True)


class TaskUpdateSchema(TaskInputSchema):
    pass


class TaskStatusUpdateSchema(Schema):
    status = fields.Str(required=True, validate=validate.OneOf(TASK_STATUSES))
