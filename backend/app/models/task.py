from app import db
from datetime import datetime

class Task(db.Model):
    __tablename__ = 'tasks'
    __table_args__ = (db.Index('ix_tasks_project_id_status', 'project_id', 'status'),)
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Keys
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', name='fk_tasks_created_by_users'), nullable=True)
    
    # Task Information
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Scheduling
    start_date = db.Column(db.DateTime, nullable=True)
    due_date = db.Column(db.DateTime, nullable=False, index=True)
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
    assignee = db.relationship('User', backref='tasks_assigned', foreign_keys=[assigned_to], lazy='selectin')
    comments = db.relationship('Comment', backref='task', lazy=True, cascade='all, delete-orphan', order_by='Comment.id')
    

    def __repr__(self):
        return f'<Task {self.title}>'