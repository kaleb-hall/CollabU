"""In-app notification service.

Handles creation, delivery, and management of user notifications.
Works with the Notification model to persist notification state.

Planned triggers:
- Task assigned → notify assignee
- Task completed → notify project owner
- Deadline approaching → notify assigned users
- Member added → notify new member
- Comment posted → notify task assignees
"""

from app import db
from app.models.notification import Notification


class NotificationService:

    @staticmethod
    def create_notification(user_id, title, message=None, type='info', link=None):
        """Create and persist a new notification."""
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            link=link
        )
        db.session.add(notification)
        db.session.commit()
        return notification

    @staticmethod
    def mark_all_read(user_id):
        """Mark all notifications as read for a user."""
        Notification.query.filter_by(user_id=user_id, read=False)\
            .update({'read': True})
        db.session.commit()

    @staticmethod
    def get_unread_count(user_id):
        """Get count of unread notifications."""
        return Notification.query.filter_by(user_id=user_id, read=False).count()
