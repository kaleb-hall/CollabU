from app import db
from datetime import datetime

class ProjectMember(db.Model):
    __tablename__ = 'project_members'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Keys
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Role in project
    role = db.Column(db.String(20), default='member', nullable=False)
    # Role options: 'admin', 'member', 'viewer'
    
    # Timestamps
    joined_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='project_memberships')
    
    def to_dict(self):
        """Convert project member to dictionary"""
        return {
            'id': self.id,
            'project_id': self.project_id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'role': self.role,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None
        }
    
    def __repr__(self):
        return f'<ProjectMember user_id={self.user_id} project_id={self.project_id}>'