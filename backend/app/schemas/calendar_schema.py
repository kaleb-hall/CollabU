from marshmallow import Schema, fields, validate, validates_schema, ValidationError
from datetime import datetime

class CalendarBlockSchema(Schema):
    """Schema for calendar block output"""
    id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    description = fields.Str(allow_none=True)
    start_time = fields.DateTime(required=True)
    end_time = fields.DateTime(required=True)
    block_type = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class CalendarBlockCreateSchema(Schema):
    """Schema for creating a calendar block"""
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    start_time = fields.DateTime(required=True)
    end_time = fields.DateTime(required=True)
    block_type = fields.Str(validate=validate.OneOf(['busy', 'class', 'work', 'sleep', 'meeting', 'other']), missing='busy')
    
    @validates_schema
    def validate_times(self, data, **kwargs):
        """Ensure end time is after start time"""
        if data['end_time'] <= data['start_time']:
            raise ValidationError('End time must be after start time', 'end_time')

class CalendarBlockUpdateSchema(Schema):
    """Schema for updating a calendar block"""
    title = fields.Str(validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    start_time = fields.DateTime()
    end_time = fields.DateTime()
    block_type = fields.Str(validate=validate.OneOf(['busy', 'class', 'work', 'sleep', 'meeting', 'other']))
    
    @validates_schema
    def validate_times(self, data, **kwargs):
        """Ensure end time is after start time if both are provided"""
        if 'start_time' in data and 'end_time' in data:
            if data['end_time'] <= data['start_time']:
                raise ValidationError('End time must be after start time', 'end_time')
