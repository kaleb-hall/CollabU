from app import db
from app.utils.time import utcnow

ACTIVITY_ACTIONS = ['task_created', 'task_moved', 'task_assigned', 'member_joined', 'comment_added', 'file_added']


class Activity(db.Model):
    """One line in a project's activity feed, written by the service layer."""

    __tablename__ = 'activities'
    __table_args__ = (db.Index('ix_activities_project_id_id', 'project_id', 'id'),)

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    target_type = db.Column(db.String(50), nullable=True)
    target_id = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    user = db.relationship('User', lazy='selectin')

    def __repr__(self):
        return f'<Activity {self.action} by User {self.user_id}>'
