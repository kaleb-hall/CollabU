"""Tests for the pure scheduling functions (no database)."""
from datetime import datetime
from zoneinfo import ZoneInfo

from app.services.scheduling import (
    Member,
    PlannedTask,
    Timeline,
    build_warnings,
    plan_schedule,
    subtract_busy,
    work_windows,
)

UTC = ZoneInfo('UTC')
LA = ZoneInfo('America/Los_Angeles')


def at(day, hour, minute=0):
    return datetime(2030, 1, day, hour, minute)


def task(id, hours=4, priority='medium', due=None, assigned_to=None, title=None):
    return PlannedTask(id=id, title=title or f'Task {id}', priority=priority, due_date=due or at(20, 0),
                       estimated_hours=hours, assigned_to=assigned_to)


# work_windows

def test_work_windows_are_nine_to_five_every_day():
    windows = work_windows(at(7, 0), at(9, 0), UTC)
    assert windows == [(at(7, 9), at(7, 17)), (at(8, 9), at(8, 17))]


def test_work_windows_start_now_if_now_is_mid_day():
    assert work_windows(at(7, 13, 30), at(8, 0), UTC) == [(at(7, 13, 30), at(7, 17))]


def test_work_windows_stop_at_deadline():
    assert work_windows(at(7, 0), at(7, 12), UTC) == [(at(7, 9), at(7, 12))]


def test_work_windows_use_local_time():
    # 9:00 to 17:00 in Los Angeles in January is 17:00 to 01:00 UTC.
    # at(7, 2) UTC is 18:00 on Jan 6 in Los Angeles, so Jan 6 is already over.
    assert work_windows(at(7, 2), at(8, 6), LA) == [(at(7, 17), at(8, 1))]


def test_work_windows_follow_daylight_saving():
    summer = work_windows(datetime(2030, 7, 1), datetime(2030, 7, 2), LA)[0]
    assert summer == (datetime(2030, 7, 1, 16), datetime(2030, 7, 2, 0))


# subtract_busy

def test_busy_time_is_cut_out_of_windows():
    windows = [(at(7, 9), at(7, 17))]
    busy = [(at(7, 10), at(7, 11, 30)), (at(7, 16), at(7, 18))]
    assert subtract_busy(windows, busy) == [(at(7, 9), at(7, 10)), (at(7, 11, 30), at(7, 16))]


def test_busy_time_outside_work_hours_costs_nothing():
    windows = [(at(7, 9), at(7, 17))]
    assert subtract_busy(windows, [(at(6, 22), at(7, 7))]) == windows


def test_block_that_started_before_the_range_still_counts():
    windows = [(at(7, 9), at(7, 17))]
    assert subtract_busy(windows, [(at(6, 20), at(7, 12))]) == [(at(7, 12), at(7, 17))]


def test_overlapping_busy_blocks_are_not_double_counted():
    windows = [(at(7, 9), at(7, 17))]
    busy = [(at(7, 10), at(7, 12)), (at(7, 11), at(7, 13))]
    assert subtract_busy(windows, busy) == [(at(7, 9), at(7, 10)), (at(7, 13), at(7, 17))]


# Timeline

def test_timeline_books_across_gaps():
    timeline = Timeline([(at(7, 9), at(7, 11)), (at(8, 9), at(8, 17))])
    assert timeline.book(3) == (at(7, 9), at(8, 10), 3)
    assert timeline.book(1) == (at(8, 10), at(8, 11), 1)
    assert timeline.free_hours == 6


def test_timeline_reports_partial_booking_when_full():
    timeline = Timeline([(at(7, 9), at(7, 11))])
    assert timeline.book(5) == (at(7, 9), at(7, 11), 2)
    assert timeline.book(1) == (None, None, 0)


def test_timeline_finish_preview_does_not_book():
    timeline = Timeline([(at(7, 9), at(7, 17))])
    assert timeline.finish_time(2) == at(7, 11)
    assert timeline.free_hours == 8


# plan_schedule

def plan(tasks, members, busy=None, now=at(7, 0), deadline=at(14, 0)):
    return plan_schedule(tasks, members, busy or {}, now, deadline, UTC)


def test_team_works_in_parallel():
    members = [Member(1, 'Ana'), Member(2, 'Sam')]
    result = plan([task(1, 8), task(2, 8)], members)
    placements = {p.task_id: p for p in result.placements}
    assert {placements[1].assigned_to, placements[2].assigned_to} == {1, 2}
    assert placements[1].start == placements[2].start == at(7, 9)


def test_higher_priority_goes_first():
    result = plan([task(1, 8, 'low'), task(2, 8, 'urgent')], [Member(1, 'Ana')])
    order = [p.task_id for p in sorted(result.placements, key=lambda p: p.start)]
    assert order == [2, 1]


def test_manual_assignment_is_kept():
    members = [Member(1, 'Ana'), Member(2, 'Sam')]
    result = plan([task(1, 2, assigned_to=1), task(2, 2, assigned_to=1)], members)
    assert [p.assigned_to for p in result.placements] == [1, 1]


def test_assignment_to_someone_no_longer_in_project_is_replaced():
    result = plan([task(1, 2, assigned_to=99)], [Member(1, 'Ana')])
    assert result.placements[0].assigned_to == 1


def test_unassigned_task_goes_to_whoever_finishes_it_first():
    members = [Member(1, 'Ana'), Member(2, 'Sam')]
    # Ana is in class all of day 7, Sam is free
    busy = {1: [(at(7, 0), at(8, 0))]}
    result = plan([task(1, 4)], members, busy)
    assert result.placements[0].assigned_to == 2
    assert result.placements[0].end == at(7, 13)


def test_task_that_does_not_fit_is_flagged_and_due_at_deadline():
    result = plan([task(1, 30)], [Member(1, 'Ana')], deadline=at(9, 0))
    placement = result.placements[0]
    assert not placement.fits
    assert placement.end == at(9, 0)
    assert not result.is_achievable


def test_totals():
    result = plan([task(1, 3), task(2, None)], [Member(1, 'Ana')], deadline=at(9, 0))
    assert result.total_hours_needed == 3 + 4  # missing estimates count as 4 hours
    assert result.total_hours_available == 16
    assert result.is_achievable


def test_member_workload():
    members = [Member(1, 'Ana'), Member(2, 'Sam')]
    result = plan([task(1, 3, assigned_to=1)], members, deadline=at(8, 0))
    assert result.workload == {1: 3, 2: 0}
    assert result.free_hours == {1: 8, 2: 8}


# build_warnings

def test_no_warnings_for_a_healthy_plan():
    members = [Member(1, 'Ana'), Member(2, 'Sam')]
    result = plan([task(1, 4), task(2, 4)], members)
    assert build_warnings(result, members) == []


def test_warns_when_tasks_do_not_fit():
    members = [Member(1, 'Ana')]
    result = plan([task(1, 30, title='Write report')], members, deadline=at(9, 0))
    warnings = build_warnings(result, members)
    assert any('Write report' in w for w in warnings)
    assert any('short by 14.0 hours' in w for w in warnings)


def test_warns_about_unbalanced_workload():
    members = [Member(1, 'Ana'), Member(2, 'Sam'), Member(3, 'Lee')]
    tasks = [task(i, 4, assigned_to=1) for i in range(1, 4)]
    warnings = build_warnings(plan(tasks, members), members)
    assert any('Ana' in w and 'more than' in w for w in warnings)


def test_small_imbalance_is_not_a_warning():
    members = [Member(1, 'Ana'), Member(2, 'Sam')]
    result = plan([task(1, 2, assigned_to=1)], members)
    assert build_warnings(result, members) == []


def test_warnings_have_no_emoji():
    members = [Member(1, 'Ana')]
    result = plan([task(1, 30)], members, deadline=at(9, 0))
    for warning in build_warnings(result, members):
        assert warning.isascii()
