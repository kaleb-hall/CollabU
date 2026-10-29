from functools import wraps

from flask_jwt_extended import jwt_required

from app import db
from app.errors import Forbidden, NotFound
from app.models import Project, ProjectMember, Task
from app.utils.auth import current_user_id


def project_access(admin=False):
    """Require a logged-in project member (or admin) for the project in the URL.

    Routes with <project_id> receive `project` instead.
    Routes with <task_id> receive `task` and `project` instead.
    """
    def decorator(route):
        @wraps(route)
        @jwt_required()
        def wrapper(*args, **kwargs):
            if 'task_id' in kwargs:
                task = db.session.get(Task, kwargs.pop('task_id'))
                if not task:
                    raise NotFound('Task not found')
                kwargs['task'] = task
                project_id = task.project_id
            else:
                project_id = kwargs.pop('project_id')

            project = db.session.get(Project, project_id)
            if not project:
                raise NotFound('Project not found')

            membership = ProjectMember.query.filter_by(
                project_id=project.id, user_id=current_user_id()
            ).first()
            if not membership:
                raise Forbidden('You are not a member of this project')
            if admin and membership.role != 'admin':
                raise Forbidden('Only project admins can do this')

            return route(*args, project=project, **kwargs)
        return wrapper
    return decorator
