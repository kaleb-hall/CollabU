from marshmallow import Schema, fields, validate, validates_schema, ValidationError
from datetime import datetime

class CalendarBlockSchema(Schema):
    """Schema for calendar block output"""
    id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    start_time = fields.DateTime(required=True)
    end_time = fields.DateTime(required=True)
    title = fields.Str(required=True)
    description = fields.Str(allow_none=True)
    block_type = fields.Str(dump_only=True)
    is_recurring = fields.Bool(dump_only=True)
    recurrence_pattern = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class CalendarBlockCreateSchema(Schema):
    """Schema for creating a calendar block"""
    start_time = fields.DateTime(required=True)
    end_time = fields.DateTime(required=True)
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    block_type = fields.Str(
        validate=validate.OneOf(['busy', 'class', 'work', 'sleep', 'meeting', 'other']),
        missing='busy'
    )
    is_recurring = fields.Bool(missing=False)
    recurrence_pattern = fields.Str(
        validate=validate.OneOf(['daily', 'weekly', 'monthly']),
        allow_none=True
    )
    
    @validates_schema
    def validate_times(self, data, **kwargs):
        """Ensure start time is before end time"""
        if data.get('start_time') and data.get('end_time'):
            if data['start_time'] >= data['end_time']:
                raise ValidationError('Start time must be before end time', 'start_time')
        
        if data.get('is_recurring') and not data.get('recurrence_pattern'):
            raise ValidationError('Recurrence pattern required for recurring blocks', 'recurrence_pattern')

class CalendarBlockUpdateSchema(Schema):
    """Schema for updating a calendar block"""
    start_time = fields.DateTime()
    end_time = fields.DateTime()
    title = fields.Str(validate=validate.Length(min=1, max=200))
    description = fields.Str(allow_none=True)
    block_type = fields.Str(validate=validate.OneOf(['busy', 'class', 'work', 'sleep', 'meeting', 'other']))
    is_recurring = fields.Bool()
    recurrence_pattern = fields.Str(validate=validate.OneOf(['daily', 'weekly', 'monthly']))
    
    @validates_schema
    def validate_times(self, data, **kwargs):
        """Ensure start time is before end time"""
        if data.get('start_time') and data.get('end_time'):
            if data['start_time'] >= data['end_time']:
                raise ValidationError('Start time must be before end time', 'start_time')
