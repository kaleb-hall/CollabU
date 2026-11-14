import secrets

from werkzeug.utils import secure_filename

from flask import current_app

from app import db
from app.errors import Forbidden, ValidationFailed
from app.models import File, Task
from app.services import activity_service
from app.services.file_types import ALLOWED_EXTENSIONS, detect_type
from app.services.storage import storage


def invalid(message):
    return ValidationFailed(details={'file': [message]})


def upload(project, uploaded, task_id, user_id):
    if not uploaded or not uploaded.filename:
        raise invalid('Choose a file to upload')
    if task_id is not None:
        task = db.session.get(Task, task_id)
        if not task or task.project_id != project.id:
            raise ValidationFailed(details={'task_id': ['That task is not in this project']})

    limit = current_app.config['MAX_UPLOAD_BYTES']
    data = uploaded.stream.read(limit + 1)
    if not data:
        raise invalid('That file is empty')
    if len(data) > limit:
        raise invalid(f'That file is too big. The limit is {limit // (1024 * 1024) or 1} MB')

    filename = secure_filename(uploaded.filename) or 'file'
    content_type = detect_type(filename, data[:8192])
    if not content_type:
        raise invalid(f"That type of file is not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    record = File(
        project_id=project.id,
        task_id=task_id,
        uploaded_by=user_id,
        filename=filename,
        content_type=content_type,
        size=len(data),
        storage_key=secrets.token_hex(16),
    )
    storage().save(record.storage_key, data)
    db.session.add(record)
    activity_service.log(project.id, user_id, 'file_added', f'added "{filename}"', 'file', None)
    db.session.commit()
    return record


def files_for(project, task_id=None):
    query = File.query.filter_by(project_id=project.id)
    if task_id is not None:
        query = query.filter_by(task_id=task_id)
    return query.order_by(File.id.desc()).all()


def open_file(record):
    return storage().open(record.storage_key)


def delete_file(project, record, user_id):
    if user_id not in (record.uploaded_by, project.created_by):
        raise Forbidden('Only the person who uploaded it or the project owner can delete this file')
    key = record.storage_key
    db.session.delete(record)
    db.session.commit()
    storage().delete(key)


def delete_stored(keys):
    for key in keys:
        storage().delete(key)
