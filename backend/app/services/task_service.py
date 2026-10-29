from app import db
from app.models import ProjectMember, Task


def create_task(project, data):
    task = Task(project_id=project.id, **data)
    db.session.add(task)
    db.session.commit()
    return task


def tasks_for_project(project):
    return Task.query.filter_by(project_id=project.id).all()


def tasks_for_user(user_id):
    project_ids = db.session.query(ProjectMember.project_id).filter_by(user_id=user_id)
    return Task.query.filter(Task.project_id.in_(project_ids)).all()


def update_task(task, data):
    for key, value in data.items():
        setattr(task, key, value)
    db.session.commit()
    return task


def delete_task(task):
    db.session.delete(task)
    db.session.commit()
