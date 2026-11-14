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
    
    # Weekly repeats: weekdays like "MO,WE,FR" and the last date (both or neither)
    repeat_days_csv = db.Column('repeat_days', db.String(20), nullable=True)
    repeat_until = db.Column(db.Date, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='calendar_blocks')
    

    @property
    def repeat_days(self):
        return self.repeat_days_csv.split(',') if self.repeat_days_csv else None

    @repeat_days.setter
    def repeat_days(self, days):
        self.repeat_days_csv = ','.join(days) if days else None

    @property
    def is_recurring(self):
        return bool(self.repeat_days_csv)

    def __repr__(self):
        return f'<CalendarBlock {self.title} for user {self.user_id}>'
