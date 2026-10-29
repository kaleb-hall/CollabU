"""The emails CollabU sends. Each function builds one email and hands it to the sender."""
from datetime import timedelta
from zoneinfo import ZoneInfo

from flask import current_app

from app.models import Task, User
from app.services.email_sender import send_email
from app.utils.time import utcnow

DIGEST_WINDOW = timedelta(hours=24)


def app_url(path):
    return current_app.config['FRONTEND_URL'].rstrip('/') + path


def local_time(value, timezone_name):
    utc = value.replace(tzinfo=ZoneInfo('UTC'))
    return utc.astimezone(ZoneInfo(timezone_name)).strftime('%a %b %-d, %-I:%M %p %Z')


def send_invite(invite, token, project, inviter):
    send_email(
        invite.email,
        f'{inviter.first_name} invited you to {project.title} on CollabU',
        f'{inviter.first_name} {inviter.last_name} invited you to join "{project.title}" on CollabU.\n\n'
        f'Accept the invite here:\n{app_url(f"/invite/{token}")}\n\n'
        f'The link works for 7 days. If you were not expecting this, you can ignore it.',
    )


def send_due_digests():
    """Email everyone who wants email a list of their tasks due in the next 24 hours."""
    now = utcnow()
    due_soon = (
        Task.query.join(User, Task.assigned_to == User.id)
        .filter(
            User.email_notifications.is_(True),
            Task.status != 'completed',
            Task.due_date > now,
            Task.due_date <= now + DIGEST_WINDOW,
        )
        .order_by(Task.due_date)
        .all()
    )
    by_user = {}
    for task in due_soon:
        by_user.setdefault(task.assignee, []).append(task)

    for user, tasks in by_user.items():
        lines = [f'- {t.title} ({t.project.title}), due {local_time(t.due_date, user.timezone)}' for t in tasks]
        send_email(
            user.email,
            f'{len(tasks)} task{"s" if len(tasks) > 1 else ""} due in the next 24 hours',
            f'Hi {user.first_name},\n\nHere is what is due soon:\n\n' + '\n'.join(lines) +
            f'\n\nOpen CollabU: {app_url("/dashboard")}\n\n'
            'You can turn these emails off in your settings.',
        )
    return len(by_user)
