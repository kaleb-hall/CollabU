"""Loads a project's data, runs the scheduling algorithm and saves the result."""
from collections import defaultdict
from zoneinfo import ZoneInfo

from app import db
from app.models import ProjectMember, Task
from app.services import calendar_service
from app.services.recurrence import expand
from app.services.scheduling import Member, PlannedTask, build_warnings, plan_schedule
from app.utils.time import iso_utc, utcnow


def load_members(project):
    """Members plus each one's timezone (repeating classes happen in local time)."""
    memberships = ProjectMember.query.filter_by(project_id=project.id).all()
    members = [Member(m.user_id, f'{m.user.first_name} {m.user.last_name}') for m in memberships]
    return members, {m.user_id: ZoneInfo(m.user.timezone) for m in memberships}


def load_busy(timezones, start, end):
    busy = defaultdict(list)
    for block in calendar_service.blocks_touching(list(timezones), start, end):
        busy[block.user_id].extend(expand(block, timezones[block.user_id], start, end))
    return busy


def calculate_task_schedule(project, timezone_name='UTC'):
    tasks = Task.query.filter(Task.project_id == project.id, Task.status != 'completed').all()
    if not tasks:
        return None, ['There are no open tasks to schedule']

    members, timezones = load_members(project)
    now = utcnow()
    if project.deadline <= now:
        return None, ['The project deadline has already passed']

    busy = load_busy(timezones, now, project.deadline)
    planned = [PlannedTask(t.id, t.title, t.priority, t.due_date, t.estimated_hours, t.assigned_to) for t in tasks]
    result = plan_schedule(planned, members, busy, now, project.deadline, ZoneInfo(timezone_name))

    save(tasks, result)
    return serialize(result, members), build_warnings(result, members)


def save(tasks, result):
    by_id = {task.id: task for task in tasks}
    for placement in result.placements:
        task = by_id[placement.task_id]
        task.assigned_to = placement.assigned_to
        task.start_date = placement.start
        task.due_date = placement.end
    db.session.commit()


def serialize(result, members):
    names = {m.user_id: m.name for m in members}
    return {
        'tasks': [{
            'task_id': p.task_id,
            'title': p.title,
            'assigned_to': p.assigned_to,
            'assigned_to_name': names[p.assigned_to],
            'start_date': iso_utc(p.start),
            'due_date': iso_utc(p.end),
            'estimated_hours': p.hours,
            'fits': p.fits,
        } for p in result.placements],
        'team_workload': [{
            'user_id': m.user_id,
            'name': m.name,
            'assigned_hours': result.workload[m.user_id],
            'free_hours': round(result.free_hours[m.user_id], 1),
        } for m in members],
        'total_hours_needed': result.total_hours_needed,
        'total_hours_available': round(result.total_hours_available, 1),
        'is_achievable': result.is_achievable,
    }
