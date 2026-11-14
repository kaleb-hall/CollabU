"""The deadline scheduling algorithm, as pure functions with no database access.

1. Each member's free time = work hours each day (in their timezone) minus their busy blocks.
2. Open tasks are ordered by priority, then due date.
3. Each task keeps its assignee if they are on the team; otherwise it goes to
   whoever would finish it earliest.
4. The task is booked into that person's next free hours. Its start and due
   dates are where the booking starts and ends.

All datetimes are naive UTC.
"""
from dataclasses import dataclass, field
from datetime import datetime, time, timedelta, timezone

WORK_START = time(9)
WORK_END = time(17)
DEFAULT_TASK_HOURS = 4.0
PRIORITY_ORDER = {'urgent': 0, 'high': 1, 'medium': 2, 'low': 3}
UNBALANCED_RATIO = 1.5
UNBALANCED_MIN_HOURS = 4


@dataclass
class Member:
    user_id: int
    name: str


@dataclass
class PlannedTask:
    id: int
    title: str
    priority: str
    due_date: datetime
    estimated_hours: float | None
    assigned_to: int | None

    @property
    def hours(self):
        return self.estimated_hours or DEFAULT_TASK_HOURS


@dataclass
class Placement:
    task_id: int
    title: str
    assigned_to: int
    start: datetime
    end: datetime
    hours: float
    fits: bool


@dataclass
class ScheduleResult:
    placements: list = field(default_factory=list)
    workload: dict = field(default_factory=dict)
    free_hours: dict = field(default_factory=dict)
    total_hours_needed: float = 0
    total_hours_available: float = 0

    @property
    def is_achievable(self):
        return all(p.fits for p in self.placements)


def hours_between(start, end):
    return (end - start).total_seconds() / 3600


def to_naive_utc(value):
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def work_windows(start, end, tz):
    """Work hours for every local day between start and end, clipped to that range."""
    windows = []
    day = start.replace(tzinfo=timezone.utc).astimezone(tz).date()
    last_day = end.replace(tzinfo=timezone.utc).astimezone(tz).date()
    while day <= last_day:
        window_start = to_naive_utc(datetime.combine(day, WORK_START, tz))
        window_end = to_naive_utc(datetime.combine(day, WORK_END, tz))
        window_start, window_end = max(window_start, start), min(window_end, end)
        if window_start < window_end:
            windows.append((window_start, window_end))
        day += timedelta(days=1)
    return windows


def subtract_busy(windows, busy):
    """Remove busy intervals from sorted free windows."""
    free = []
    busy = sorted(busy)
    for window_start, window_end in windows:
        cursor = window_start
        for busy_start, busy_end in busy:
            if busy_end <= cursor or busy_start >= window_end:
                continue
            if busy_start > cursor:
                free.append((cursor, busy_start))
            cursor = max(cursor, busy_end)
        if cursor < window_end:
            free.append((cursor, window_end))
    return free


class Timeline:
    """One person's remaining free time, booked from the front."""

    def __init__(self, free):
        self.free = list(free)

    @property
    def free_hours(self):
        return sum(hours_between(start, end) for start, end in self.free)

    def finish_time(self, hours):
        remaining = hours
        for start, end in self.free:
            available = hours_between(start, end)
            if available >= remaining:
                return start + timedelta(hours=remaining)
            remaining -= available
        return None

    def book(self, hours):
        """Book up to `hours`. Returns (start, end, hours_booked)."""
        remaining, first_start, last_end = hours, None, None
        while remaining > 0 and self.free:
            start, end = self.free[0]
            used = min(remaining, hours_between(start, end))
            last_end = start + timedelta(hours=used)
            first_start = first_start or start
            remaining -= used
            if last_end >= end:
                self.free.pop(0)
            else:
                self.free[0] = (last_end, end)
        return first_start, last_end, hours - remaining


def order_tasks(tasks):
    return sorted(tasks, key=lambda t: (PRIORITY_ORDER.get(t.priority, len(PRIORITY_ORDER)), t.due_date, t.id))


def choose_assignee(task, timelines):
    if task.assigned_to in timelines:
        return task.assigned_to

    def finish(user_id):
        done = timelines[user_id].finish_time(task.hours)
        return (done is None, done or datetime.max, -timelines[user_id].free_hours, user_id)

    return min(timelines, key=finish)


def plan_schedule(tasks, members, busy_by_user, now, deadline, tz):
    windows = work_windows(now, deadline, tz)
    timelines = {m.user_id: Timeline(subtract_busy(windows, busy_by_user.get(m.user_id, []))) for m in members}
    result = ScheduleResult(
        workload={m.user_id: 0 for m in members},
        free_hours={user_id: timeline.free_hours for user_id, timeline in timelines.items()},
    )
    result.total_hours_available = sum(result.free_hours.values())

    for task in order_tasks(tasks):
        result.total_hours_needed += task.hours
        if not timelines:
            continue
        user_id = choose_assignee(task, timelines)
        start, end, booked = timelines[user_id].book(task.hours)
        fits = booked >= task.hours
        result.workload[user_id] += task.hours
        result.placements.append(Placement(
            task_id=task.id,
            title=task.title,
            assigned_to=user_id,
            start=start or deadline,
            end=end if fits else deadline,
            hours=task.hours,
            fits=fits,
        ))
    return result


def build_warnings(result, members):
    warnings = []
    late = [p.title for p in result.placements if not p.fits]
    if late:
        warnings.append(f"These tasks do not fit before the deadline: {', '.join(late)}")
    shortage = result.total_hours_needed - result.total_hours_available
    if shortage > 0:
        warnings.append(
            f'The project needs {result.total_hours_needed:.1f} hours but the team only has '
            f'{result.total_hours_available:.1f} free hours, so you are short by {shortage:.1f} hours'
        )

    if len(members) > 1:
        average = sum(result.workload.values()) / len(members)
        names = {m.user_id: m.name for m in members}
        for user_id, hours in result.workload.items():
            if hours > average * UNBALANCED_RATIO and hours - average >= UNBALANCED_MIN_HOURS:
                warnings.append(f'{names[user_id]} has {hours:.1f} hours of work, a lot more than the team average of {average:.1f}')
    return warnings
