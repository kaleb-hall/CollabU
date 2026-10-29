"""In-app notifications. Triggers call notify(); the caller commits."""
from datetime import timedelta

from sqlalchemy.exc import IntegrityError

from app import db
from app.errors import NotFound
from app.models import Notification, Task
from app.utils.time import utcnow

DUE_SOON_WINDOW = timedelta(hours=24)


def project_link(project_id):
    return f'/projects/{project_id}'


def notify(user_id, type, title, message=None, link=None, dedupe_key=None):
    db.session.add(Notification(
        user_id=user_id, type=type, title=title, message=message, link=link, dedupe_key=dedupe_key,
    ))


def create_due_soon(user_id):
    """Create one reminder per open task of mine due in the next 24 hours.

    Called whenever the inbox is polled, so no background job is needed.
    The key includes the due date, so moving a deadline gives a fresh reminder.
    """
    now = utcnow()
    tasks = Task.query.filter(
        Task.assigned_to == user_id,
        Task.status != 'completed',
        Task.due_date > now,
        Task.due_date <= now + DUE_SOON_WINDOW,
    ).all()
    keys = {task.id: f'due_soon:{task.id}:{task.due_date.isoformat()}' for task in tasks}
    existing = {
        key for (key,) in db.session.query(Notification.dedupe_key)
        .filter(Notification.user_id == user_id, Notification.dedupe_key.in_(keys.values()))
    }
    missing = [task for task in tasks if keys[task.id] not in existing]
    if not missing:
        return
    for task in missing:
        notify(user_id, 'deadline', f'"{task.title}" is due within 24 hours',
               link=project_link(task.project_id), dedupe_key=keys[task.id])
    try:
        db.session.commit()
    except IntegrityError:
        # Another poll created the same reminder at the same moment; that is fine.
        db.session.rollback()


def inbox_query(user_id):
    return Notification.query.filter_by(user_id=user_id)


def unread_count(user_id):
    return Notification.query.filter_by(user_id=user_id, read=False).count()


def mark_read(notification_id, user_id):
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
    if not notification:
        raise NotFound('Notification not found')
    notification.read = True
    db.session.commit()
    return notification


def mark_all_read(user_id):
    Notification.query.filter_by(user_id=user_id, read=False).update({'read': True})
    db.session.commit()
