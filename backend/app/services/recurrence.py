"""Turning a weekly calendar block into the actual time slots it covers.

A block stores its first occurrence (start_time, end_time in UTC) and, if it
repeats, the weekdays and the last date. Each repeat happens at the same LOCAL
clock time in the owner's timezone, so a 10:00 class stays at 10:00 when
daylight saving starts or ends. The calendar and the scheduler both use this.
"""
from datetime import datetime, timedelta, timezone

WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']


def to_local(value, tz):
    return value.replace(tzinfo=timezone.utc).astimezone(tz)


def to_naive_utc(value):
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def expand(block, tz, range_start, range_end):
    """(start, end) pairs in naive UTC for every occurrence overlapping the range."""
    duration = block.end_time - block.start_time
    if not block.repeat_days:
        overlaps = block.start_time < range_end and block.end_time > range_start
        return [(block.start_time, block.end_time)] if overlaps else []

    first_local = to_local(block.start_time, tz)
    weekdays = {WEEKDAYS.index(day) for day in block.repeat_days}
    # Start a little early so an occurrence that began before the range is included
    day = max(first_local.date(), to_local(range_start - duration, tz).date())
    last_day = min(block.repeat_until, to_local(range_end, tz).date())

    slots = []
    while day <= last_day:
        if day.weekday() in weekdays:
            start = to_naive_utc(datetime.combine(day, first_local.time(), tz))
            end = start + duration
            if start < range_end and end > range_start:
                slots.append((start, end))
        day += timedelta(days=1)
    return slots
