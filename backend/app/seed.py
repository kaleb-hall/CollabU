"""Demo data for trying CollabU locally: `flask seed`.

Everything belongs to people with @collabu.test emails. Running it again deletes
their data and builds it fresh; nobody else's data is touched.
"""
from datetime import timedelta

from app import db
from app.models import Activity, CalendarBlock, Comment, Invite, Notification, Project, ProjectMember, Task, User
from app.services import comment_service, notification_service, project_service, task_service
from app.utils.time import utcnow

DEMO_DOMAIN = '@collabu.test'
DEMO_PASSWORD = 'Demo1234!'
TIMEZONE = 'America/New_York'

PEOPLE = [
    ('demo@collabu.test', 'Maya', 'Ortiz'),
    ('leo@collabu.test', 'Leo', 'Park'),
    ('sam@collabu.test', 'Sam', 'Rivera'),
]


def seed():
    clear()
    now = utcnow().replace(minute=0, second=0, microsecond=0)
    maya, leo, sam = [make_user(*person) for person in PEOPLE]

    jazz = make_project(maya, 'History of Jazz essay', 'A 3,000 word group essay on bebop and its legacy.', now + timedelta(days=14))
    for person in (leo, sam):
        project_service.add_member(jazz, person.id)
    jazz_tasks = [
        add_task(jazz, maya, 'Pick a topic and thesis', 'completed', maya, now - timedelta(days=5), 2),
        add_task(jazz, maya, 'Find 8 scholarly sources', 'completed', leo, now - timedelta(days=2), 4),
        add_task(jazz, maya, 'Write the outline', 'review', maya, now + timedelta(days=1), 3),
        add_task(jazz, maya, 'Draft sections 1 and 2', 'in_progress', leo, now + timedelta(days=4), 6),
        add_task(jazz, maya, 'Draft sections 3 and 4', 'todo', sam, now + timedelta(days=6), 6),
        add_task(jazz, maya, 'Get interview with a local musician', 'blocked', sam, now + timedelta(days=3), 2),
        add_task(jazz, maya, 'Edit and format citations', 'todo', maya, now + timedelta(days=12), 3),
    ]
    comment_service.add_comment(jazz_tasks[2], leo.id, 'Looks good. Can we swap sections 2 and 3?')
    comment_service.add_comment(jazz_tasks[2], maya.id, 'Yes, done. Sam, can you take the last two?')
    comment_service.add_comment(jazz_tasks[5], sam.id, 'Still waiting to hear back from the jazz club.')

    chem = make_project(maya, 'Chem lab report', 'Titration lab write-up with graphs.', now + timedelta(days=5))
    project_service.add_member(chem, sam.id)
    add_task(chem, maya, 'Clean up the data table', 'completed', sam, now - timedelta(days=1), 1)
    add_task(chem, maya, 'Make the titration graphs', 'in_progress', maya, now + timedelta(hours=20), 2)
    add_task(chem, maya, 'Write the discussion', 'todo', maya, now + timedelta(days=3), 3)
    add_task(chem, maya, 'Proofread', 'todo', sam, now + timedelta(days=4), 1)

    add_busy_time(maya, now)
    notification_service.notify(maya.id, 'team', 'Welcome to the demo!',
                                message='Everything here is made up. Run `flask seed` to start over.',
                                link=notification_service.project_link(jazz.id))
    notification_service.create_due_soon(maya.id)
    db.session.commit()
    return maya


def clear():
    demo_ids = [user.id for user in User.query.filter(User.email.endswith(DEMO_DOMAIN))]
    if not demo_ids:
        return
    for project in Project.query.filter(Project.created_by.in_(demo_ids)):
        db.session.delete(project)
    db.session.flush()
    for model, column in (
        (Notification, Notification.user_id),
        (CalendarBlock, CalendarBlock.user_id),
        (Comment, Comment.user_id),
        (Activity, Activity.user_id),
        (Invite, Invite.invited_by),
        (ProjectMember, ProjectMember.user_id),
    ):
        model.query.filter(column.in_(demo_ids)).delete(synchronize_session=False)
    Task.query.filter(Task.assigned_to.in_(demo_ids)).update({'assigned_to': None}, synchronize_session=False)
    User.query.filter(User.id.in_(demo_ids)).delete(synchronize_session=False)
    db.session.commit()
    # Forget the deleted rows, so new demo users can reuse their ids cleanly
    db.session.expunge_all()


def make_user(email, first_name, last_name):
    user = User(email=email, first_name=first_name, last_name=last_name, timezone=TIMEZONE)
    user.set_password(DEMO_PASSWORD)
    db.session.add(user)
    db.session.flush()
    return user


def make_project(owner, title, description, deadline):
    project, _ = project_service.create_project(
        {'title': title, 'description': description, 'deadline': deadline}, owner.id)
    return project


def add_task(project, creator, title, status, assignee, due, hours):
    return task_service.create_task(project, {
        'title': title, 'status': status, 'assigned_to': assignee.id,
        'due_date': due, 'estimated_hours': hours, 'priority': 'medium',
    }, creator.id)


def add_busy_time(user, now):
    """A weekly class and a one-off shift, so the calendar and scheduler have something to work around."""
    monday = (now - timedelta(days=now.weekday())).replace(hour=15)  # 10:00 or 11:00 in New York
    db.session.add(CalendarBlock(
        user_id=user.id, title='Econ 101 lecture', block_type='class',
        start_time=monday, end_time=monday + timedelta(hours=1, minutes=15),
        repeat_days=['MO', 'WE', 'FR'], repeat_until=(now + timedelta(days=90)).date(),
    ))
    shift = (now + timedelta(days=2)).replace(hour=22)
    db.session.add(CalendarBlock(
        user_id=user.id, title='Library shift', block_type='work',
        start_time=shift, end_time=shift + timedelta(hours=3),
    ))
