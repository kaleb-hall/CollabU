from marshmallow import Schema, ValidationError, fields, validate, validates_schema

from app.schemas.fields import UtcDateTime

BLOCK_TYPES = ['busy', 'class', 'work', 'sleep', 'meeting', 'other']


class CalendarBlockSchema(Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    title = fields.Str(dump_only=True)
    description = fields.Str(dump_only=True)
    start_time = UtcDateTime(dump_only=True)
    end_time = UtcDateTime(dump_only=True)
    block_type = fields.Str(dump_only=True)
    created_at = UtcDateTime(dump_only=True)
    updated_at = UtcDateTime(dump_only=True)


def check_times(data):
    if 'start_time' in data and 'end_time' in data and data['end_time'] <= data['start_time']:
        raise ValidationError('End time must be after start time', 'end_time')


class CalendarBlockCreateSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    start_time = UtcDateTime(required=True)
    end_time = UtcDateTime(required=True)
    block_type = fields.Str(validate=validate.OneOf(BLOCK_TYPES), load_default='busy')

    @validates_schema
    def validate_times(self, data, **kwargs):
        check_times(data)


class CalendarBlockUpdateSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    start_time = UtcDateTime()
    end_time = UtcDateTime()
    block_type = fields.Str(validate=validate.OneOf(BLOCK_TYPES))

    @validates_schema
    def validate_times(self, data, **kwargs):
        check_times(data)


class DateRangeSchema(Schema):
    start = UtcDateTime(required=True)
    end = UtcDateTime(required=True)

    @validates_schema
    def validate_range(self, data, **kwargs):
        if data['end'] <= data['start']:
            raise ValidationError('End must be after start', 'end')
