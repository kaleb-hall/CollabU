from app import db
from app.models.calendar_block import CalendarBlock
from datetime import datetime, timedelta

class CalendarService:
    
    @staticmethod
    def create_calendar_block(data, user_id):
        """
        Create a new calendar block
        Returns: (block, error)
        """
        try:
            block = CalendarBlock(
                user_id=user_id,
                start_time=data['start_time'],
                end_time=data['end_time'],
                title=data['title'],
                description=data.get('description'),
                block_type=data.get('block_type', 'busy'),
                is_recurring=data.get('is_recurring', False),
                recurrence_pattern=data.get('recurrence_pattern')
            )
            
            db.session.add(block)
            db.session.commit()
            return block, None
            
        except Exception as e:
            db.session.rollback()
            return None, {'message': 'Error creating calendar block', 'details': str(e)}
    
    @staticmethod
    def get_user_calendar_blocks(user_id, start_date=None, end_date=None):
        """
        Get all calendar blocks for a user
        Optional: Filter by date range
        Returns: list of blocks
        """
        query = CalendarBlock.query.filter_by(user_id=user_id)
        
        if start_date:
            query = query.filter(CalendarBlock.end_time >= start_date)
        if end_date:
            query = query.filter(CalendarBlock.start_time <= end_date)
        
        blocks = query.order_by(CalendarBlock.start_time.asc()).all()
        return blocks
    
    @staticmethod
    def get_calendar_block_by_id(block_id, user_id):
        """
        Get specific calendar block (only if owned by user)
        Returns: (block, error)
        """
        block = CalendarBlock.query.get(block_id)
        
        if not block:
            return None, {'message': 'Calendar block not found', 'code': 'NOT_FOUND'}
        
        if block.user_id != user_id:
            return None, {'message': 'Access denied', 'code': 'FORBIDDEN'}
        
        return block, None
    
    @staticmethod
    def update_calendar_block(block_id, data, user_id):
        """
        Update a calendar block
        Returns: (block, error)
        """
        block = CalendarBlock.query.get(block_id)
        
        if not block:
            return None, {'message': 'Calendar block not found', 'code': 'NOT_FOUND'}
        
        if block.user_id != user_id:
            return None, {'message': 'Access denied', 'code': 'FORBIDDEN'}
        
        try:
            # Update fields
            if 'start_time' in data:
                block.start_time = data['start_time']
            if 'end_time' in data:
                block.end_time = data['end_time']
            if 'title' in data:
                block.title = data['title']
            if 'description' in data:
                block.description = data['description']
            if 'block_type' in data:
                block.block_type = data['block_type']
            if 'is_recurring' in data:
                block.is_recurring = data['is_recurring']
            if 'recurrence_pattern' in data:
                block.recurrence_pattern = data['recurrence_pattern']
            
            block.updated_at = datetime.utcnow()
            
            db.session.commit()
            return block, None
            
        except Exception as e:
            db.session.rollback()
            return None, {'message': 'Error updating calendar block', 'details': str(e)}
    
    @staticmethod
    def delete_calendar_block(block_id, user_id):
        """
        Delete a calendar block
        Returns: (success, error)
        """
        block = CalendarBlock.query.get(block_id)
        
        if not block:
            return False, {'message': 'Calendar block not found', 'code': 'NOT_FOUND'}
        
        if block.user_id != user_id:
            return False, {'message': 'Access denied', 'code': 'FORBIDDEN'}
        
        try:
            db.session.delete(block)
            db.session.commit()
            return True, None
            
        except Exception as e:
            db.session.rollback()
            return False, {'message': 'Error deleting calendar block', 'details': str(e)}
    
    @staticmethod
    def calculate_available_hours(user_id, start_date, end_date):
        """
        Calculate available hours for a user in a date range
        Returns: dictionary with availability info
        """
        # Get all blocks in range
        blocks = CalendarService.get_user_calendar_blocks(user_id, start_date, end_date)
        
        # Calculate total days
        total_days = (end_date - start_date).days
        
        # Assume 8 working hours per day
        WORK_HOURS_PER_DAY = 8
        max_hours = total_days * WORK_HOURS_PER_DAY
        
        # Calculate blocked hours
        blocked_hours = 0
        for block in blocks:
            # Calculate duration in hours
            duration = (block.end_time - block.start_time).total_seconds() / 3600
            blocked_hours += duration
        
        available_hours = max(0, max_hours - blocked_hours)
        
        return {
            'user_id': user_id,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'total_days': total_days,
            'max_possible_hours': max_hours,
            'blocked_hours': blocked_hours,
            'available_hours': available_hours,
            'availability_percentage': (available_hours / max_hours * 100) if max_hours > 0 else 0
        }
