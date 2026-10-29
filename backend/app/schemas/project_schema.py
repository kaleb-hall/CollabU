from marshmallow import EXCLUDE, Schema, ValidationError, fields, validate, validates

from app.schemas.fields import UtcDateTime
from app.schemas.user_schema import UserSchema
from app.utils.time import utcnow

PROJECT_STATUSES = ['active', 'completed', 'archived', 'on_hold']
MEMBER_ROLES = ['admin', 'member', 'viewer']


class ProjectMemberSchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    role = fields.Str(dump_only=True)
    joined_at = UtcDateTime(dump_only=True)
    user = fields.Nested(UserSchema, dump_only=True)


class ProjectSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(dump_only=True)
    description = fields.Str(dump_only=True)
    deadline = UtcDateTime(dump_only=True)
    status = fields.Str(dump_only=True)
    created_by = fields.Int(dump_only=True)
    created_at = UtcDateTime(dump_only=True)
    updated_at = UtcDateTime(dump_only=True)
    owner = fields.Nested(UserSchema, dump_only=True)
    members = fields.Nested(ProjectMemberSchema, many=True, dump_only=True)


class NextTaskSchema(Schema):
    id = fields.Int()
    title = fields.Str()
    due_date = UtcDateTime()


class TaskSummarySchema(Schema):
    task_counts = fields.Dict(keys=fields.Str(), values=fields.Int())
    next_task = fields.Nested(NextTaskSchema, allow_none=True)


def validate_future(value):
    if value < utcnow():
        raise ValidationError('Deadline must be in the future')


class ProjectCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    deadline = UtcDateTime(required=True, validate=validate_future)
    auto_generate_tasks = fields.Bool(load_default=False)
    template = fields.Str(load_default=None, allow_none=True)


class ProjectUpdateSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    deadline = UtcDateTime(validate=validate_future)
    status = fields.Str(validate=validate.OneOf(PROJECT_STATUSES))


class AddMemberSchema(Schema):
    user_id = fields.Int(required=True)
    role = fields.Str(validate=validate.OneOf(MEMBER_ROLES), load_default='member')


def validate_timezone(value):
    from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
    try:
        ZoneInfo(value)
    except (ZoneInfoNotFoundError, ValueError):
        raise ValidationError('Unknown timezone')


class ScheduleRequestSchema(Schema):
    timezone = fields.Str(load_default='UTC', validate=validate_timezone)
