from app import db
from datetime import datetime

class CalendarBlock(db.Model):
    __tablename__ = 'calendar_blocks'
    __table_args__ = (db.Index('ix_calendar_blocks_user_id_start_time', 'user_id', 'start_time'),)
    
    # Primary Key
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Key
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Time Block
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    
    # Block Info
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    block_type = db.Column(db.String(50), default='busy', nullable=False)
    # Types: 'busy', 'class', 'work', 'sleep', 'meeting'
    
    # Recurring
    is_recurring = db.Column(db.Boolean, default=False, nullable=False)
    recurrence_pattern = db.Column(db.String(50), nullable=True)
    # Patterns: 'daily', 'weekly', 'monthly'
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='calendar_blocks')
    

    def __repr__(self):
        return f'<CalendarBlock {self.title} for user {self.user_id}>'
