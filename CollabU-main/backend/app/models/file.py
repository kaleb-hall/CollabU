from app import db
from datetime import datetime


class File(db.Model):
    """File attachments linked to projects and tasks.

    Planned integrations:
    - Google Drive file linking and preview
    - Direct file upload with local storage fallback
    - File versioning and change tracking
    """

    __tablename__ = 'files'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=True)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=True)
    file_size = db.Column(db.Integer, nullable=True)  # bytes
    storage_url = db.Column(db.String(500), nullable=False)
    source = db.Column(db.String(50), default='upload', nullable=False)
    # Sources: 'upload', 'google_drive'

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    uploader = db.relationship('User', backref='uploaded_files')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'task_id': self.task_id,
            'uploaded_by': self.uploaded_by,
            'filename': self.filename,
            'file_type': self.file_type,
            'file_size': self.file_size,
            'storage_url': self.storage_url,
            'source': self.source,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<File {self.filename}>'
