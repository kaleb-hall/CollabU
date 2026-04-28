from app import db
from datetime import datetime


class Activity(db.Model):
    """Activity feed tracking actions across projects.

    Captures events like task creation, status changes,
    member additions, and deadline modifications for
    team-wide visibility.
    """

    __tablename__ = 'activities'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    # Actions: 'created_task', 'completed_task', 'updated_status',
    #          'added_member', 'uploaded_file', 'updated_deadline'
    target_type = db.Column(db.String(50), nullable=True)  # 'task', 'project', 'member'
    target_id = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship('User', backref='activities')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'user_id': self.user_id,
            'action': self.action,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user': self.user.to_dict() if self.user else None
        }

    def __repr__(self):
        return f'<Activity {self.action} by User {self.user_id}>'
