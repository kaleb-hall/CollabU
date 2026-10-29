from app import db
from app.errors import NotFound
from app.models import CalendarBlock


def blocks_in_range(user_id, start=None, end=None):
    """Blocks that overlap the range at all, not only ones fully inside it."""
    query = CalendarBlock.query.filter_by(user_id=user_id)
    if start:
        query = query.filter(CalendarBlock.end_time > start)
    if end:
        query = query.filter(CalendarBlock.start_time < end)
    return query.order_by(CalendarBlock.start_time).all()


def get_block(block_id, user_id):
    block = CalendarBlock.query.filter_by(id=block_id, user_id=user_id).first()
    if not block:
        raise NotFound('Calendar block not found')
    return block


def overlap_warnings(block):
    others = CalendarBlock.query.filter(
        CalendarBlock.user_id == block.user_id,
        CalendarBlock.id != block.id,
        CalendarBlock.start_time < block.end_time,
        CalendarBlock.end_time > block.start_time,
    ).all()
    return [f'Overlaps with "{other.title}"' for other in others]


def create_block(user_id, data):
    block = CalendarBlock(user_id=user_id, **data)
    db.session.add(block)
    db.session.commit()
    return block


def update_block(block, data):
    for key, value in data.items():
        setattr(block, key, value)
    db.session.commit()
    return block


def delete_block(block):
    db.session.delete(block)
    db.session.commit()
