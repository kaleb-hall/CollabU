from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.models import Notification
from app.schemas.notification_schema import NotificationSchema
from app.services import notification_service
from app.utils.auth import current_user_id
from app.utils.pagination import PageArgsSchema, paginate

notification_bp = Blueprint('notifications', __name__)

notification_schema = NotificationSchema()


@notification_bp.route('', methods=['GET'])
@jwt_required()
def list_notifications():
    user_id = current_user_id()
    args = PageArgsSchema().load(request.args)
    notification_service.create_due_soon(user_id)
    notifications, next_cursor = paginate(notification_service.inbox_query(user_id), Notification, args)
    return jsonify({
        'notifications': notification_schema.dump(notifications, many=True),
        'next_cursor': next_cursor,
        'unread_count': notification_service.unread_count(user_id),
    }), 200


@notification_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    user_id = current_user_id()
    notification_service.create_due_soon(user_id)
    return jsonify({'unread_count': notification_service.unread_count(user_id)}), 200


@notification_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_read(notification_id):
    notification = notification_service.mark_read(notification_id, current_user_id())
    return jsonify({'notification': notification_schema.dump(notification)}), 200


@notification_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    notification_service.mark_all_read(current_user_id())
    return jsonify({'unread_count': 0}), 200
