from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.schemas.calendar_schema import (
    CalendarBlockCreateSchema,
    CalendarBlockSchema,
    CalendarBlockUpdateSchema,
    DateRangeSchema,
    OccurrenceSchema,
)
from app.services import calendar_service
from app.utils.auth import current_user_id
from app.utils.request_data import load_json

calendar_bp = Blueprint('calendar', __name__)

block_schema = CalendarBlockSchema()


@calendar_bp.route('/blocks', methods=['GET'])
@jwt_required()
def list_blocks():
    date_range = DateRangeSchema().load(request.args)
    slots = calendar_service.occurrences(current_user_id(), date_range['start'], date_range['end'])
    return jsonify({'blocks': OccurrenceSchema(many=True).dump(slots)}), 200


@calendar_bp.route('/blocks/<int:block_id>', methods=['GET'])
@jwt_required()
def get_block(block_id):
    return jsonify({'block': block_schema.dump(calendar_service.get_block(block_id, current_user_id()))}), 200


@calendar_bp.route('/blocks', methods=['POST'])
@jwt_required()
def create_block():
    block = calendar_service.create_block(current_user_id(), load_json(CalendarBlockCreateSchema()))
    return jsonify({'block': block_schema.dump(block), 'warnings': calendar_service.overlap_warnings(block)}), 201


@calendar_bp.route('/blocks/<int:block_id>', methods=['PUT'])
@jwt_required()
def update_block(block_id):
    block = calendar_service.get_block(block_id, current_user_id())
    block = calendar_service.update_block(block, load_json(CalendarBlockUpdateSchema()))
    return jsonify({'block': block_schema.dump(block), 'warnings': calendar_service.overlap_warnings(block)}), 200


@calendar_bp.route('/blocks/<int:block_id>', methods=['DELETE'])
@jwt_required()
def delete_block(block_id):
    calendar_service.delete_block(calendar_service.get_block(block_id, current_user_id()))
    return '', 204
