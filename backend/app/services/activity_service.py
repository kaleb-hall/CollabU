"""The project activity feed. Services call log(); the caller commits."""
from app import db
from app.models import Activity, User


def full_name(user):
    return f'{user.first_name} {user.last_name}'


def log(project_id, actor_id, action, description, target_type=None, target_id=None):
    actor = db.session.get(User, actor_id)
    db.session.add(Activity(
        project_id=project_id,
        user_id=actor_id,
        action=action,
        description=f'{full_name(actor)} {description}',
        target_type=target_type,
        target_id=target_id,
    ))


def feed_query(project):
    return Activity.query.filter_by(project_id=project.id)
