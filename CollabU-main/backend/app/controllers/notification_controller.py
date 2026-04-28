from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.notification import Notification

notification_bp = Blueprint('notifications', __name__)


@notification_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get all notifications for the authenticated user."""
    user_id = get_jwt_identity()
    notifications = Notification.query.filter_by(user_id=user_id)\
        .order_by(Notification.created_at.desc()).all()
    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': sum(1 for n in notifications if not n.read)
    }), 200


@notification_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read."""
    user_id = get_jwt_identity()
    notification = Notification.query.filter_by(
        id=notification_id, user_id=user_id
    ).first_or_404()
    notification.mark_read()
    db.session.commit()
    return jsonify({'message': 'Notification marked as read'}), 200


# TODO: Implement notification preferences endpoint
# TODO: Implement bulk mark-as-read
# TODO: Add WebSocket support for real-time notifications
