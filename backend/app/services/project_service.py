from app import db
from app.errors import Conflict, NotFound
from app.models import Project, ProjectMember, Task, User
from app.services.ai_task_generator import AITaskGenerator


def create_project(data, user_id, auto_generate_tasks=False):
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
        suggestions = AITaskGenerator.generate_tasks(project.title, project.description or '', project.deadline)
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
    return AITaskGenerator.generate_tasks(project.title, project.description or '', project.deadline)


def projects_for_user(user_id):
    return Project.query.join(ProjectMember).filter(ProjectMember.user_id == user_id).all()


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
