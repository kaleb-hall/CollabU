from collections import defaultdict

from sqlalchemy.orm import selectinload

from app import db
from app.errors import Conflict, NotFound
from app.models import Project, ProjectMember, Task, User
from app.schemas.task_schema import TASK_STATUSES
from app.services import task_templates


def create_project(data, user_id, auto_generate_tasks=False, template=None):
    project = Project(
        title=data['title'],
        description=data.get('description'),
        deadline=data['deadline'],
        created_by=user_id,
    )
    db.session.add(project)
    db.session.flush()
    db.session.add(ProjectMember(project_id=project.id, user_id=user_id, role='admin'))

    suggestions = None
    if auto_generate_tasks:
        suggestions = task_templates.suggest_tasks(project.title, project.description or '', project.deadline, template)
        for suggestion in suggestions['tasks']:
            db.session.add(Task(
                project_id=project.id,
                title=suggestion['title'],
                description=suggestion['description'],
                due_date=suggestion['due_date'],
                estimated_hours=suggestion['estimated_hours'],
                priority=suggestion['priority'],
            ))

    db.session.commit()
    return project, suggestions


def task_suggestions(project):
    return task_templates.suggest_tasks(project.title, project.description or '', project.deadline)


def projects_for_user(user_id):
    return (
        Project.query.join(ProjectMember)
        .filter(ProjectMember.user_id == user_id)
        .options(selectinload(Project.members))
        .order_by(Project.deadline)
        .all()
    )


def task_summaries(project_ids):
    """Task counts per status and the next open task for each project, in two queries."""
    counts = defaultdict(lambda: {status: 0 for status in TASK_STATUSES})
    rows = (
        db.session.query(Task.project_id, Task.status, db.func.count(Task.id))
        .filter(Task.project_id.in_(project_ids))
        .group_by(Task.project_id, Task.status)
    )
    for project_id, status, count in rows:
        counts[project_id][status] = count

    next_tasks = {}
    open_tasks = (
        db.session.query(Task.project_id, Task.id, Task.title, Task.due_date)
        .filter(Task.project_id.in_(project_ids), Task.status != 'completed')
        .order_by(Task.due_date)
    )
    for project_id, task_id, title, due_date in open_tasks:
        next_tasks.setdefault(project_id, {'id': task_id, 'title': title, 'due_date': due_date})

    return {
        project_id: {
            'task_counts': {**counts[project_id], 'total': sum(counts[project_id].values())},
            'next_task': next_tasks.get(project_id),
        }
        for project_id in project_ids
    }


def update_project(project, data):
    for key, value in data.items():
        setattr(project, key, value)
    db.session.commit()
    return project


def delete_project(project):
    db.session.delete(project)
    db.session.commit()


def add_member(project, user_id, role='member'):
    if not db.session.get(User, user_id):
        raise NotFound('User not found')
    if ProjectMember.query.filter_by(project_id=project.id, user_id=user_id).first():
        raise Conflict('That person is already a member')
    member = ProjectMember(project_id=project.id, user_id=user_id, role=role)
    db.session.add(member)
    db.session.commit()
    return member


def remove_member(project, member_id):
    member = db.session.get(ProjectMember, member_id)
    if not member or member.project_id != project.id:
        raise NotFound('Member not found')
    db.session.delete(member)
    db.session.commit()
