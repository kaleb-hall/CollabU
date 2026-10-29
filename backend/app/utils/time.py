"""All times are stored as naive UTC datetimes and sent to clients as ISO 8601 with a Z."""
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_utc(value):
    """Convert an aware datetime to naive UTC. Naive datetimes are assumed to already be UTC."""
    if value is None or value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def iso_utc(value):
    return value.isoformat() + 'Z' if value else None


def is_valid_timezone(name):
    try:
        ZoneInfo(name)
        return True
    except (ZoneInfoNotFoundError, ValueError):
        return False
