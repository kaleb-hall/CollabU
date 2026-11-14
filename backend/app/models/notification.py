from app import db
from app.utils.time import utcnow

NOTIFICATION_TYPES = ['assignment', 'deadline', 'team', 'review']


class Notification(db.Model):
    __tablename__ = 'notifications'
    __table_args__ = (
        db.Index('ix_notifications_user_id_id', 'user_id', 'id'),
        db.Index('ix_notifications_user_id_read', 'user_id', 'read'),
        # Stops the same "due soon" reminder from being created twice
        db.UniqueConstraint('user_id', 'dedupe_key', name='uq_notifications_user_dedupe'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=True)
    link = db.Column(db.String(500), nullable=True)
    read = db.Column(db.Boolean, default=False, nullable=False)
    dedupe_key = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    def __repr__(self):
        return f'<Notification {self.title}>'
