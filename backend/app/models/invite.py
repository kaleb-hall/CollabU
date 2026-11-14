from app import db
from app.utils.time import utcnow


class Invite(db.Model):
    """An emailed invitation to join a project. Only a hash of the token is stored."""

    __tablename__ = 'invites'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False, index=True)
    email = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), default='member', nullable=False)
    token_hash = db.Column(db.String(64), nullable=False, unique=True)
    invited_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    accepted_at = db.Column(db.DateTime, nullable=True)

    inviter = db.relationship('User', lazy='selectin')

    @property
    def status(self):
        if self.accepted_at:
            return 'accepted'
        return 'expired' if self.expires_at <= utcnow() else 'pending'

    def __repr__(self):
        return f'<Invite {self.email} to Project {self.project_id}>'
