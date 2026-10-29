"""Tests for expanding weekly blocks into real time slots (no database)."""
from datetime import date, datetime
from types import SimpleNamespace
from zoneinfo import ZoneInfo

from app.services.recurrence import expand

UTC = ZoneInfo('UTC')
LA = ZoneInfo('America/Los_Angeles')


def block(start, end, days=None, until=None):
    return SimpleNamespace(start_time=start, end_time=end, repeat_days=days, repeat_until=until)


def test_one_off_block_inside_the_range():
    b = block(datetime(2030, 1, 7, 10), datetime(2030, 1, 7, 11))
    assert expand(b, UTC, datetime(2030, 1, 1), datetime(2030, 2, 1)) == [(datetime(2030, 1, 7, 10), datetime(2030, 1, 7, 11))]


def test_one_off_block_outside_the_range():
    b = block(datetime(2030, 1, 7, 10), datetime(2030, 1, 7, 11))
    assert expand(b, UTC, datetime(2030, 2, 1), datetime(2030, 3, 1)) == []


def test_weekly_block_on_chosen_days_until_end_date():
    # Jan 7 2030 is a Monday
    b = block(datetime(2030, 1, 7, 10), datetime(2030, 1, 7, 11, 30), days=['MO', 'WE'], until=date(2030, 1, 16))
    starts = [s for s, _ in expand(b, UTC, datetime(2030, 1, 1), datetime(2030, 2, 1))]
    assert starts == [datetime(2030, 1, 7, 10), datetime(2030, 1, 9, 10), datetime(2030, 1, 14, 10), datetime(2030, 1, 16, 10)]


def test_only_occurrences_inside_the_range_are_returned():
    b = block(datetime(2030, 1, 7, 10), datetime(2030, 1, 7, 11), days=['MO'], until=date(2030, 12, 31))
    result = expand(b, UTC, datetime(2030, 1, 13), datetime(2030, 1, 22))
    assert result == [(datetime(2030, 1, 14, 10), datetime(2030, 1, 14, 11)), (datetime(2030, 1, 21, 10), datetime(2030, 1, 21, 11))]


def test_does_not_repeat_before_the_first_block():
    b = block(datetime(2030, 1, 9, 10), datetime(2030, 1, 9, 11), days=['MO', 'WE'], until=date(2030, 1, 14))
    starts = [s for s, _ in expand(b, UTC, datetime(2030, 1, 1), datetime(2030, 2, 1))]
    assert starts == [datetime(2030, 1, 9, 10), datetime(2030, 1, 14, 10)]


def test_class_stays_at_the_same_local_time_across_daylight_saving():
    # 10:00 in Los Angeles on Monday Oct 28 2030 (PDT, UTC-7); clocks go back on Nov 3
    b = block(datetime(2030, 10, 28, 17), datetime(2030, 10, 28, 18), days=['MO'], until=date(2030, 11, 30))
    starts = [s for s, _ in expand(b, LA, datetime(2030, 10, 1), datetime(2030, 11, 12))]
    assert starts == [datetime(2030, 10, 28, 17), datetime(2030, 11, 4, 18), datetime(2030, 11, 11, 18)]


def test_weekday_is_the_local_day_not_the_utc_day():
    # 21:00 Monday in Los Angeles is 05:00 Tuesday UTC
    b = block(datetime(2030, 1, 8, 5), datetime(2030, 1, 8, 6), days=['MO'], until=date(2030, 1, 14))
    starts = [s for s, _ in expand(b, LA, datetime(2030, 1, 1), datetime(2030, 2, 1))]
    assert starts == [datetime(2030, 1, 8, 5), datetime(2030, 1, 15, 5)]


def test_occurrence_that_started_before_the_range_still_counts():
    b = block(datetime(2030, 1, 7, 22), datetime(2030, 1, 8, 6), days=['MO'], until=date(2030, 1, 31))
    assert expand(b, UTC, datetime(2030, 1, 8), datetime(2030, 1, 9)) == [(datetime(2030, 1, 7, 22), datetime(2030, 1, 8, 6))]
