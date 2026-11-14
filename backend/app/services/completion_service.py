"""Finishing a project: complete, reopen, lock, archive, the final note and the summary."""
from collections import Counter

from app import db
from app.errors import Conflict, Forbidden
from app.models import File, ProjectMember, Task, User
from app.services import activity_service, project_updates
from app.utils.time import utcnow


def is_admin(project, user_id):
    member = ProjectMember.query.filter_by(project_id=project.id, user_id=user_id).first()
    return bool(member and member.role == 'admin')


def open_task_count(project):
    return Task.query.filter(Task.project_id == project.id, Task.status != 'completed').count()


def complete(project, user_id):
    """The creator can finish at any time; anyone else once every task is done."""
    if project.status == 'completed':
        raise Conflict('This project is already completed')
    if user_id != project.created_by and open_task_count(project):
        raise Forbidden('You can complete the project once all tasks are done')

    project.status = 'completed'
    project.completed_at = utcnow()
    project.completed_by = user_id
    project.locked = True
    activity_service.log(project.id, user_id, 'project_completed', 'completed the project', 'project', project.id)
    project_updates.announce(project, f'{project.title} is complete', skip={user_id})
    db.session.commit()
    return project


def reopen(project, user_id):
    if project.status != 'completed':
        raise Conflict('This project is not completed')
    project.status = 'active'
    project.completed_at = None
    project.completed_by = None
    project.final_note = None
    project.locked = False
    activity_service.log(project.id, user_id, 'project_reopened', 'reopened the project', 'project', project.id)
    db.session.commit()
    return project


def set_locked(project, locked):
    project.locked = locked
    db.session.commit()
    return project


def set_archived(project, archived):
    if archived and not project.archived_at:
        project.archived_at = utcnow()
    elif not archived:
        project.archived_at = None
    db.session.commit()
    return project


def send_final_note(project, user_id, message):
    """One note to the whole team, from whoever finished the project or an admin."""
    if project.status != 'completed':
        raise Conflict('Complete the project before sending a final note')
    if project.final_note:
        raise Conflict('The final note was already sent')
    if user_id != project.completed_by and not is_admin(project, user_id):
        raise Forbidden('Only the person who completed the project or an admin can send the final note')

    project.final_note = message
    sender = db.session.get(User, user_id)
    project_updates.announce(project, f'{activity_service.full_name(sender)} sent a final note on {project.title}',
                             message=message, skip={user_id})
    db.session.commit()
    return project


def summary(project):
    tasks = Task.query.filter_by(project_id=project.id).order_by(Task.completed_at).all()
    done = [task for task in tasks if task.status == 'completed']
    counts = Counter(task.assigned_to for task in done if task.assigned_to)
    people = {user.id: user for user in User.query.filter(User.id.in_(counts)).all()} if counts else {}
    return {
        'started_at': project.created_at,
        'completed_at': project.completed_at,
        'completed_by': project.finisher,
        'final_note': project.final_note,
        'completed_tasks': done,
        'open_task_count': len(tasks) - len(done),
        'contributors': [{'user': people[user_id], 'tasks_completed': count} for user_id, count in counts.most_common()],
        'files': File.query.filter_by(project_id=project.id).order_by(File.created_at).all(),
    }
