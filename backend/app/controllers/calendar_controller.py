from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import CalendarBlock, User
from app.schemas.calendar_schema import (
    CalendarBlockSchema,
    CalendarBlockCreateSchema,
    CalendarBlockUpdateSchema
)
from app import db
from datetime import datetime

calendar_bp = Blueprint('calendar', __name__)

calendar_block_schema = CalendarBlockSchema()
calendar_blocks_schema = CalendarBlockSchema(many=True)
calendar_block_create_schema = CalendarBlockCreateSchema()
calendar_block_update_schema = CalendarBlockUpdateSchema()

@calendar_bp.route('/blocks', methods=['GET'])
@jwt_required()
def get_calendar_blocks():
    """Get all calendar blocks for the current user"""
    current_user_id = get_jwt_identity()
    
    # Get query parameters for filtering
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = CalendarBlock.query.filter_by(user_id=current_user_id)
    
    if start_date:
        query = query.filter(CalendarBlock.start_time >= datetime.fromisoformat(start_date.replace('Z', '+00:00')))
    if end_date:
        query = query.filter(CalendarBlock.end_time <= datetime.fromisoformat(end_date.replace('Z', '+00:00')))
    
    blocks = query.all()
    return jsonify({'blocks': calendar_blocks_schema.dump(blocks)}), 200

@calendar_bp.route('/blocks/<int:block_id>', methods=['GET'])
@jwt_required()
def get_calendar_block(block_id):
    """Get a specific calendar block"""
    current_user_id = get_jwt_identity()
    
    block = CalendarBlock.query.filter_by(id=block_id, user_id=current_user_id).first()
    if not block:
        return jsonify({'error': 'Calendar block not found'}), 404
    
    return jsonify({'block': calendar_block_schema.dump(block)}), 200

@calendar_bp.route('/blocks', methods=['POST'])
@jwt_required()
def create_calendar_block():
    """Create a new calendar block"""
    current_user_id = get_jwt_identity()
    
    try:
        data = calendar_block_create_schema.load(request.json)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
    # Check for overlapping blocks
    overlapping = CalendarBlock.query.filter(
        CalendarBlock.user_id == current_user_id,
        CalendarBlock.start_time < data['end_time'],
        CalendarBlock.end_time > data['start_time']
    ).first()
    
    if overlapping:
        return jsonify({'warning': 'This time overlaps with an existing block', 'block_id': overlapping.id}), 200
    
    block = CalendarBlock(
        user_id=current_user_id,
        title=data['title'],
        description=data.get('description'),
        start_time=data['start_time'],
        end_time=data['end_time'],
        block_type=data.get('block_type', 'busy'),
        is_recurring=data.get('is_recurring', False),
        recurrence_rule=data.get('recurrence_rule')
    )
    
    db.session.add(block)
    db.session.commit()
    
    return jsonify({'block': calendar_block_schema.dump(block)}), 201

@calendar_bp.route('/blocks/<int:block_id>', methods=['PUT'])
@jwt_required()
def update_calendar_block(block_id):
    """Update a calendar block"""
    current_user_id = get_jwt_identity()
    
    block = CalendarBlock.query.filter_by(id=block_id, user_id=current_user_id).first()
    if not block:
        return jsonify({'error': 'Calendar block not found'}), 404
    
    try:
        data = calendar_block_update_schema.load(request.json)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    
    # Update fields
    for key, value in data.items():
        setattr(block, key, value)
    
    db.session.commit()
    
    return jsonify({'block': calendar_block_schema.dump(block)}), 200

@calendar_bp.route('/blocks/<int:block_id>', methods=['DELETE'])
@jwt_required()
def delete_calendar_block(block_id):
    """Delete a calendar block"""
    current_user_id = get_jwt_identity()
    
    block = CalendarBlock.query.filter_by(id=block_id, user_id=current_user_id).first()
    if not block:
        return jsonify({'error': 'Calendar block not found'}), 404
    
    db.session.delete(block)
    db.session.commit()
    
    return jsonify({'message': 'Calendar block deleted successfully'}), 200

@calendar_bp.route('/availability', methods=['GET'])
@jwt_required()
def get_availability():
    """Get user availability for a time range"""
    current_user_id = get_jwt_identity()
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if not start_date or not end_date:
        return jsonify({'error': 'start_date and end_date are required'}), 400
    
    blocks = CalendarBlock.query.filter(
        CalendarBlock.user_id == current_user_id,
        CalendarBlock.start_time >= datetime.fromisoformat(start_date.replace('Z', '+00:00')),
        CalendarBlock.end_time <= datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    ).all()
    
    return jsonify({
        'blocks': calendar_blocks_schema.dump(blocks),
        'start_date': start_date,
        'end_date': end_date
    }), 200
