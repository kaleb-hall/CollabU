"""This week's workload per member: open hours due this week vs free hours left this week."""
from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from app import db
from app.models import Task, User
from app.services.deadline_service import load_busy, load_members
from app.services.scheduling import DEFAULT_TASK_HOURS, hours_between, subtract_busy, work_windows
from app.utils.time import utcnow


def current_week(tz):
    """Monday 00:00 to the next Monday 00:00 in the given timezone, as naive UTC."""
    today = utcnow().replace(tzinfo=timezone.utc).astimezone(tz).date()
    monday = today - timedelta(days=today.weekday())
    start = datetime.combine(monday, time(0), tz)
    end = datetime.combine(monday + timedelta(days=7), time(0), tz)
    return (start.astimezone(timezone.utc).replace(tzinfo=None),
            end.astimezone(timezone.utc).replace(tzinfo=None))


def project_workload(project, viewer_id):
    week_start, week_end = current_week(ZoneInfo(db.session.get(User, viewer_id).timezone))
    members, timezones = load_members(project)
    free_from = max(utcnow(), week_start)
    busy = load_busy(timezones, free_from, week_end)

    tasks = Task.query.filter(
        Task.project_id == project.id,
        Task.status != 'completed',
        Task.assigned_to.isnot(None),
        Task.due_date >= week_start,
        Task.due_date < week_end,
    ).all()

    rows = []
    for member in members:
        mine = [task for task in tasks if task.assigned_to == member.user_id]
        assigned = sum(task.estimated_hours or DEFAULT_TASK_HOURS for task in mine)
        free_slots = subtract_busy(work_windows(free_from, week_end, timezones[member.user_id]), busy[member.user_id])
        free = round(sum(hours_between(start, end) for start, end in free_slots), 1)
        rows.append({
            'user_id': member.user_id,
            'name': member.name,
            'assigned_hours': assigned,
            'task_count': len(mine),
            'free_hours': free,
            'overloaded': assigned > free,
        })
    return week_start, week_end, rows
