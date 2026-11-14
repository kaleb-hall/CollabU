from functools import wraps

from flask_jwt_extended import jwt_required

from app import db
from app.errors import Forbidden, NotFound, ProjectLocked
from app.models import File, Project, ProjectMember, Task
from app.utils.auth import current_user_id


# URL ids that belong to a project, and the model to look them up in
CHILD_MODELS = {'task': (Task, 'Task'), 'file': (File, 'File')}


def project_access(admin=False, editable=False):
    """Require a logged-in project member (or admin) for the project in the URL.

    editable=True also refuses the request while the project is locked.

    Routes with <project_id> receive `project` instead.
    Routes with <task_id> or <file_id> receive `task` or `file`, plus `project`.
    """
    def decorator(route):
        @wraps(route)
        @jwt_required()
        def wrapper(*args, **kwargs):
            child = next((name for name in CHILD_MODELS if f'{name}_id' in kwargs), None)
            if child:
                model, label = CHILD_MODELS[child]
                record = db.session.get(model, kwargs.pop(f'{child}_id'))
                if not record:
                    raise NotFound(f'{label} not found')
                kwargs[child] = record
                project_id = record.project_id
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
            if editable and project.locked:
                raise ProjectLocked()

            return route(*args, project=project, **kwargs)
        return wrapper
    return decorator
