from sqlalchemy.orm import selectinload

from app import db
from app.errors import ValidationFailed
from app.models import ProjectMember, Task, User
from app.schemas.task_schema import STATUS_LABELS
from app.services import activity_service
from app.utils.time import utcnow


def check_assignee(project, user_id):
    if user_id is None:
        return
    if not ProjectMember.query.filter_by(project_id=project.id, user_id=user_id).first():
        raise ValidationFailed(details={'assigned_to': ['That person is not a member of this project']})


def apply_changes(task, data):
    for key, value in data.items():
        setattr(task, key, value)
    if 'status' in data:
        task.completed_at = (task.completed_at or utcnow()) if task.status == 'completed' else None


def create_task(project, data, actor_id):
    check_assignee(project, data.get('assigned_to'))
    task = Task(project_id=project.id, created_by=actor_id)
    apply_changes(task, data)
    db.session.add(task)
    db.session.flush()
    activity_service.log(project.id, actor_id, 'task_created', f'created "{task.title}"', 'task', task.id)
    db.session.commit()
    return task


def tasks_for_project(project):
    return Task.query.filter_by(project_id=project.id).order_by(Task.due_date).all()


def tasks_for_user(user_id):
    return Task.query.filter_by(assigned_to=user_id).options(selectinload(Task.project)).order_by(Task.due_date).all()


def update_task(task, data, actor_id):
    if 'assigned_to' in data:
        check_assignee(task.project, data['assigned_to'])
    old_status, old_assignee = task.status, task.assigned_to
    apply_changes(task, data)
    if task.status != old_status:
        on_status_changed(task, actor_id)
    if task.assigned_to != old_assignee and task.assigned_to:
        on_assigned(task, actor_id)
    db.session.commit()
    return task


def on_status_changed(task, actor_id):
    activity_service.log(task.project_id, actor_id, 'task_moved',
                         f'moved "{task.title}" to {STATUS_LABELS[task.status]}', 'task', task.id)


def on_assigned(task, actor_id):
    assignee = db.session.get(User, task.assigned_to)
    activity_service.log(task.project_id, actor_id, 'task_assigned',
                         f'assigned "{task.title}" to {activity_service.full_name(assignee)}', 'task', task.id)


def delete_task(task):
    db.session.delete(task)
    db.session.commit()
