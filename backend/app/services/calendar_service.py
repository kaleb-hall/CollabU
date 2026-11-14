from datetime import timedelta
from zoneinfo import ZoneInfo

from app import db
from app.errors import NotFound, ValidationFailed
from app.models import CalendarBlock, User
from app.services.recurrence import WEEKDAYS, expand

OVERLAP_CHECK_WINDOW = timedelta(days=28)


def user_timezone(user_id):
    return ZoneInfo(db.session.get(User, user_id).timezone)


def blocks_touching(user_ids, start, end):
    """Blocks that may have an occurrence in the range, including repeats that started earlier."""
    return CalendarBlock.query.filter(
        CalendarBlock.user_id.in_(user_ids),
        CalendarBlock.start_time < end,
        db.or_(CalendarBlock.end_time > start, CalendarBlock.repeat_until >= start.date()),
    ).all()


def occurrences(user_id, start, end):
    tz = user_timezone(user_id)
    slots = [
        {'block': block, 'start': slot_start, 'end': slot_end}
        for block in blocks_touching([user_id], start, end)
        for slot_start, slot_end in expand(block, tz, start, end)
    ]
    return sorted(slots, key=lambda slot: slot['start'])


def get_block(block_id, user_id):
    block = CalendarBlock.query.filter_by(id=block_id, user_id=user_id).first()
    if not block:
        raise NotFound('Calendar block not found')
    return block


def check_repeat(block):
    days, until = block.repeat_days, block.repeat_until
    if bool(days) != bool(until):
        raise ValidationFailed(details={'repeat_days': ['Pick the days and the end date together']})
    if until and until < block.start_time.date() - timedelta(days=1):
        raise ValidationFailed(details={'repeat_until': ['The end date must be after the first one']})
    if days and len(set(days)) != len(days):
        raise ValidationFailed(details={'repeat_days': ['Each day can only be picked once']})
    if days:
        block.repeat_days = sorted(days, key=WEEKDAYS.index)


def overlap_warnings(block):
    """Titles of my other blocks that collide with this one in the next four weeks."""
    tz = user_timezone(block.user_id)
    start = block.start_time
    end = start + OVERLAP_CHECK_WINDOW if block.is_recurring else block.end_time
    mine = expand(block, tz, start, end)
    warnings = []
    for other in blocks_touching([block.user_id], start, end):
        if other.id == block.id:
            continue
        theirs = expand(other, tz, start, end)
        if any(a < d and c < b for a, b in mine for c, d in theirs):
            warnings.append(f'Overlaps with "{other.title}"')
    return warnings


def create_block(user_id, data):
    block = CalendarBlock(user_id=user_id, **data)
    check_repeat(block)
    db.session.add(block)
    db.session.commit()
    return block


def update_block(block, data):
    for key, value in data.items():
        setattr(block, key, value)
    if block.end_time <= block.start_time:
        raise ValidationFailed(details={'end_time': ['End time must be after start time']})
    check_repeat(block)
    db.session.commit()
    return block


def delete_block(block):
    db.session.delete(block)
    db.session.commit()
