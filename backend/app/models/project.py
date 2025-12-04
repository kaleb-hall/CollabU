from app import db
from datetime import datetime

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    deadline = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='active', nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships (only include models we've created)
    owner = db.relationship('User', backref='projects_owned', foreign_keys=[created_by])
    members = db.relationship('ProjectMember', backref='project', lazy=True, cascade='all, delete-orphan')
    tasks = db.relationship('Task', backref='project', lazy=True, cascade='all, delete-orphan')
    # We'll add these later when we create those models:
    # files = db.relationship('File', backref='project', lazy=True, cascade='all, delete-orphan')
    # activities = db.relationship('Activity', backref='project', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_members=False, include_tasks=False):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'status': self.status,
            'created_by': self.created_by,
            'owner': self.owner.to_dict() if self.owner else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_members:
            data['members'] = [member.to_dict() for member in self.members]
        if include_tasks:
            data['tasks'] = [task.to_dict() for task in self.tasks]
        
        return data
    
    def __repr__(self):
        return f'<Project {self.title}>'
