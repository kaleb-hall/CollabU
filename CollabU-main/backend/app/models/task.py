from app import db
from datetime import datetime

class Task(db.Model):
    __tablename__ = 'tasks'
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Keys
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Task Information
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Scheduling
    start_date = db.Column(db.DateTime, nullable=True)
    due_date = db.Column(db.DateTime, nullable=False)
    estimated_hours = db.Column(db.Float, nullable=True)
    
    # Priority and Status
    priority = db.Column(db.String(20), default='medium', nullable=False)
    # Priority options: 'low', 'medium', 'high', 'urgent'
    
    status = db.Column(db.String(20), default='todo', nullable=False)
    # Status options: 'todo', 'in_progress', 'review', 'completed', 'blocked'
    
    # Progress
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    assignee = db.relationship('User', backref='tasks_assigned', foreign_keys=[assigned_to])
    
    def to_dict(self, include_project=False):
        """Convert task to dictionary"""
        data = {
            'id': self.id,
            'project_id': self.project_id,
            'title': self.title,
            'description': self.description,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'estimated_hours': self.estimated_hours,
            'priority': self.priority,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'assignee': self.assignee.to_dict() if self.assignee else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_project:
            data['project'] = self.project.to_dict() if self.project else None
        
        return data
    
    def mark_complete(self):
        """Mark task as completed"""
        self.status = 'completed'
        self.completed_at = datetime.utcnow()
    
    def __repr__(self):
        return f'<Task {self.title}>'