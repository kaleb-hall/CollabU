from app import db
from datetime import datetime

class ProjectMember(db.Model):
    __tablename__ = 'project_members'
    __table_args__ = (db.UniqueConstraint('project_id', 'user_id', name='uq_project_members_project_user'),)
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Keys
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Role in project
    role = db.Column(db.String(20), default='member', nullable=False)
    # Role options: 'admin', 'member', 'viewer'
    
    # Timestamps
    joined_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='project_memberships', lazy='selectin')
    

    def __repr__(self):
        return f'<ProjectMember user_id={self.user_id} project_id={self.project_id}>'