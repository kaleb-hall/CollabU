from app import db
from datetime import datetime

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    deadline = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='active', nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Finishing a project. Status is 'active' or 'completed'.
    completed_at = db.Column(db.DateTime, nullable=True)
    completed_by = db.Column(db.Integer, db.ForeignKey('users.id', name='fk_projects_completed_by_users'), nullable=True)
    final_note = db.Column(db.Text, nullable=True)
    # Locked projects are read only, except comments and downloads.
    locked = db.Column(db.Boolean, default=False, server_default=db.false(), nullable=False)
    # Archived projects leave the sidebar and Home but stay searchable.
    archived_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships (only include models we've created)
    owner = db.relationship('User', backref='projects_owned', foreign_keys=[created_by], lazy='selectin')
    finisher = db.relationship('User', foreign_keys=[completed_by], lazy='selectin')
    members = db.relationship('ProjectMember', backref='project', lazy=True, cascade='all, delete-orphan')
    tasks = db.relationship('Task', backref='project', lazy=True, cascade='all, delete-orphan')
    activities = db.relationship('Activity', backref='project', lazy=True, cascade='all, delete-orphan')
    invites = db.relationship('Invite', backref='project', lazy=True, cascade='all, delete-orphan')
    files = db.relationship('File', backref='project', lazy=True, cascade='all, delete-orphan')
    

    def __repr__(self):
        return f'<Project {self.title}>'
