from sqlalchemy.orm import selectinload

from app import db
from app.errors import ValidationFailed
from app.models import ProjectMember, Task
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


def create_task(project, data):
    check_assignee(project, data.get('assigned_to'))
    task = Task(project_id=project.id)
    apply_changes(task, data)
    db.session.add(task)
    db.session.commit()
    return task


def tasks_for_project(project):
    return Task.query.filter_by(project_id=project.id).order_by(Task.due_date).all()


def tasks_for_user(user_id):
    return Task.query.filter_by(assigned_to=user_id).options(selectinload(Task.project)).order_by(Task.due_date).all()


def update_task(task, data):
    if 'assigned_to' in data:
        check_assignee(task.project, data['assigned_to'])
    apply_changes(task, data)
    db.session.commit()
    return task


def delete_task(task):
    db.session.delete(task)
    db.session.commit()
