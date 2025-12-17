from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from datetime import datetime, timedelta
from app.services.calendar_service import CalendarService
from app.schemas.calendar_schema import (
    CalendarBlockSchema,
    CalendarBlockCreateSchema,
    CalendarBlockUpdateSchema
)

calendar_bp = Blueprint('calendar', __name__)

# Initialize schemas
calendar_block_schema = CalendarBlockSchema()
calendar_blocks_schema = CalendarBlockSchema(many=True)
calendar_block_create_schema = CalendarBlockCreateSchema()
calendar_block_update_schema = CalendarBlockUpdateSchema()

@calendar_bp.route('/blocks', methods=['POST'])
@jwt_required()
def create_calendar_block():
    """
    Create a new calendar block
    POST /api/calendar/blocks
    Body: {
        "start_time": "2025-12-20T09:00:00",
        "end_time": "2025-12-20T17:00:00",
        "title": "Work",
        "description": "Full-time job",
        "block_type": "work",
        "is_recurring": true,
        "recurrence_pattern": "weekly"
    }
    """
    current_user_id = int(get_jwt_identity())
    
    try:
        data = calendar_block_create_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400
    
    block, error = CalendarService.create_calendar_block(data, current_user_id)
    
    if error:
        return jsonify({'error': error['message']}), 500
    
    return jsonify({
        'message': 'Calendar block created successfully',
        'block': calendar_block_schema.dump(block)
    }), 201

@calendar_bp.route('/blocks', methods=['GET'])
@jwt_required()
def get_calendar_blocks():
    """
    Get all calendar blocks for current user
    GET /api/calendar/blocks
    Optional query params: ?start_date=2025-12-01&end_date=2025-12-31
    """
    current_user_id = int(get_jwt_identity())
    
    # Get date filters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Parse dates if provided
    if start_date:
        try:
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except:
            return jsonify({'error': 'Invalid start_date format'}), 400
    
    if end_date:
        try:
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except:
            return jsonify({'error': 'Invalid end_date format'}), 400
    
    blocks = CalendarService.get_user_calendar_blocks(current_user_id, start_date, end_date)
    
    return jsonify({
        'blocks': calendar_blocks_schema.dump(blocks),
        'count': len(blocks)
    }), 200

@calendar_bp.route('/blocks/<int:block_id>', methods=['GET'])
@jwt_required()
def get_calendar_block(block_id):
    """
    Get specific calendar block
    GET /api/calendar/blocks/<id>
    """
    current_user_id = int(get_jwt_identity())
    
    block, error = CalendarService.get_calendar_block_by_id(block_id, current_user_id)
    
    if error:
        status_code = 404 if error['code'] == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'block': calendar_block_schema.dump(block)
    }), 200

@calendar_bp.route('/blocks/<int:block_id>', methods=['PUT'])
@jwt_required()
def update_calendar_block(block_id):
    """
    Update a calendar block
    PUT /api/calendar/blocks/<id>
    Body: { "title": "Updated title", "block_type": "meeting" }
    """
    current_user_id = int(get_jwt_identity())
    
    try:
        data = calendar_block_update_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400
    
    block, error = CalendarService.update_calendar_block(block_id, data, current_user_id)
    
    if error:
        status_code = 404 if error['code'] == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'message': 'Calendar block updated successfully',
        'block': calendar_block_schema.dump(block)
    }), 200

@calendar_bp.route('/blocks/<int:block_id>', methods=['DELETE'])
@jwt_required()
def delete_calendar_block(block_id):
    """
    Delete a calendar block
    DELETE /api/calendar/blocks/<id>
    """
    current_user_id = int(get_jwt_identity())
    
    success, error = CalendarService.delete_calendar_block(block_id, current_user_id)
    
    if error:
        status_code = 404 if error['code'] == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'message': 'Calendar block deleted successfully'
    }), 200

@calendar_bp.route('/availability', methods=['GET'])
@jwt_required()
def get_availability():
    """
    Calculate available hours for current user
    GET /api/calendar/availability
    Query params: ?start_date=2025-12-01&end_date=2025-12-31
    """
    current_user_id = int(get_jwt_identity())
    
    # Get date range (default to next 30 days)
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    if start_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
        except:
            return jsonify({'error': 'Invalid start_date format'}), 400
    else:
        start_date = datetime.utcnow()
    
    if end_date_str:
        try:
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
        except:
            return jsonify({'error': 'Invalid end_date format'}), 400
    else:
        end_date = start_date + timedelta(days=30)
    
    availability = CalendarService.calculate_available_hours(current_user_id, start_date, end_date)
    
    return jsonify(availability), 200
