from marshmallow import EXCLUDE, Schema, ValidationError, fields, pre_load, validate, validates

from app.schemas.fields import UtcDateTime
from app.schemas.file_schema import FileSchema
from app.schemas.user_schema import UserSchema
from app.utils.time import is_valid_timezone, utcnow

PROJECT_STATUSES = ['active', 'completed']
MEMBER_ROLES = ['admin', 'member', 'viewer']


class ProjectMemberSchema(Schema):
    id = fields.Int(dump_only=True)
    project_id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    role = fields.Str(dump_only=True)
    joined_at = UtcDateTime(dump_only=True)
    email_updates = fields.Bool(dump_only=True)
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
    completed_at = UtcDateTime(dump_only=True)
    completed_by = fields.Int(dump_only=True)
    final_note = fields.Str(dump_only=True)
    locked = fields.Bool(dump_only=True)
    archived_at = UtcDateTime(dump_only=True)
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


def validate_timezone(value):
    if not is_valid_timezone(value):
        raise ValidationError('Unknown timezone')


class ScheduleRequestSchema(Schema):
    timezone = fields.Str(load_default='UTC', validate=validate_timezone)


class LockSchema(Schema):
    locked = fields.Bool(required=True)


class ArchiveSchema(Schema):
    archived = fields.Bool(required=True)


class MemberSettingsSchema(Schema):
    email_updates = fields.Bool(required=True)


class FinalNoteSchema(Schema):
    message = fields.Str(required=True, validate=validate.Length(min=1, max=2000))

    @pre_load
    def strip_message(self, data, **kwargs):
        if isinstance(data.get('message'), str):
            data = {**data, 'message': data['message'].strip()}
        return data


class SummaryTaskSchema(Schema):
    id = fields.Int()
    title = fields.Str()
    completed_at = UtcDateTime()
    assignee = fields.Nested(UserSchema, allow_none=True)


class ContributorSchema(Schema):
    user = fields.Nested(UserSchema)
    tasks_completed = fields.Int()


class CompletionSummarySchema(Schema):
    started_at = UtcDateTime()
    completed_at = UtcDateTime(allow_none=True)
    completed_by = fields.Nested(UserSchema, allow_none=True)
    final_note = fields.Str(allow_none=True)
    completed_tasks = fields.Nested(SummaryTaskSchema, many=True)
    open_task_count = fields.Int()
    contributors = fields.Nested(ContributorSchema, many=True)
    files = fields.Nested(FileSchema, many=True)
