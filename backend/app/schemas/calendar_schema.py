from marshmallow import Schema, ValidationError, fields, validate, validates_schema

from app.schemas.fields import UtcDateTime
from app.services.recurrence import WEEKDAYS

BLOCK_TYPES = ['busy', 'class', 'work', 'sleep', 'meeting', 'other']


class CalendarBlockSchema(Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    title = fields.Str(dump_only=True)
    description = fields.Str(dump_only=True)
    start_time = UtcDateTime(dump_only=True)
    end_time = UtcDateTime(dump_only=True)
    block_type = fields.Str(dump_only=True)
    repeat_days = fields.List(fields.Str(), dump_only=True)
    repeat_until = fields.Date(dump_only=True)
    is_recurring = fields.Bool(dump_only=True)
    created_at = UtcDateTime(dump_only=True)
    updated_at = UtcDateTime(dump_only=True)


class OccurrenceSchema(Schema):
    """One time slot of a block. Repeating blocks appear once per occurrence."""
    id = fields.Function(lambda o: o['block'].id)
    title = fields.Function(lambda o: o['block'].title)
    description = fields.Function(lambda o: o['block'].description)
    block_type = fields.Function(lambda o: o['block'].block_type)
    is_recurring = fields.Function(lambda o: o['block'].is_recurring)
    repeat_days = fields.Function(lambda o: o['block'].repeat_days)
    repeat_until = fields.Function(lambda o: o['block'].repeat_until.isoformat() if o['block'].repeat_until else None)
    start_time = UtcDateTime(attribute='start')
    end_time = UtcDateTime(attribute='end')
    series_start_time = fields.Function(lambda o: UtcDateTime()._serialize(o['block'].start_time, None, None))
    series_end_time = fields.Function(lambda o: UtcDateTime()._serialize(o['block'].end_time, None, None))


def check_times(data):
    if 'start_time' in data and 'end_time' in data and data['end_time'] <= data['start_time']:
        raise ValidationError('End time must be after start time', 'end_time')


class CalendarBlockCreateSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    start_time = UtcDateTime(required=True)
    end_time = UtcDateTime(required=True)
    block_type = fields.Str(validate=validate.OneOf(BLOCK_TYPES), load_default='busy')
    repeat_days = fields.List(fields.Str(validate=validate.OneOf(WEEKDAYS)), allow_none=True, load_default=None)
    repeat_until = fields.Date(allow_none=True, load_default=None)

    @validates_schema
    def validate_times(self, data, **kwargs):
        check_times(data)


class CalendarBlockUpdateSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    start_time = UtcDateTime()
    end_time = UtcDateTime()
    block_type = fields.Str(validate=validate.OneOf(BLOCK_TYPES))
    repeat_days = fields.List(fields.Str(validate=validate.OneOf(WEEKDAYS)), allow_none=True)
    repeat_until = fields.Date(allow_none=True)

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
