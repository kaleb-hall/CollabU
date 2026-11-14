from app import db
from app.utils.time import utcnow


class File(db.Model):
    """An uploaded attachment on a project, optionally linked to one of its tasks."""

    __tablename__ = 'files'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False, index=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=True, index=True)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    content_type = db.Column(db.String(120), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    storage_key = db.Column(db.String(64), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    uploader = db.relationship('User', lazy='selectin')

    def __repr__(self):
        return f'<File {self.filename}>'
