from app import db
from datetime import datetime


class Notification(db.Model):
    """User notifications for project and task events.

    Planned notification triggers:
    - Task assigned to user
    - Task deadline approaching (24h, 48h)
    - Project milestone reached
    - Team member joined project
    - Task status changed on assigned items
    """

    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=True)
    type = db.Column(db.String(50), default='info', nullable=False)
    # Types: 'info', 'deadline', 'assignment', 'milestone', 'team'
    read = db.Column(db.Boolean, default=False, nullable=False)
    link = db.Column(db.String(500), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship('User', backref='notifications')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'read': self.read,
            'link': self.link,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def mark_read(self):
        self.read = True

    def __repr__(self):
        return f'<Notification {self.title}>'
