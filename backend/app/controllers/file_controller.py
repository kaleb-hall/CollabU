from flask import Blueprint, jsonify, request, send_file

from app.schemas.file_schema import FileQuerySchema, FileSchema
from app.services import file_service
from app.utils.auth import current_user_id
from app.utils.permissions import project_access

file_bp = Blueprint('files', __name__)

file_schema = FileSchema()


@file_bp.route('/projects/<int:project_id>/files', methods=['POST'])
@project_access()
def upload_file(project):
    task_id = FileQuerySchema().load(request.form)['task_id']
    record = file_service.upload(project, request.files.get('file'), task_id, current_user_id())
    return jsonify({'file': file_schema.dump(record)}), 201


@file_bp.route('/projects/<int:project_id>/files', methods=['GET'])
@project_access()
def list_files(project):
    task_id = FileQuerySchema().load(request.args)['task_id']
    return jsonify({'files': file_schema.dump(file_service.files_for(project, task_id), many=True)}), 200


@file_bp.route('/files/<int:file_id>/download', methods=['GET'])
@project_access()
def download_file(project, file):
    response = send_file(
        file_service.open_file(file),
        mimetype=file.content_type,
        as_attachment=True,
        download_name=file.filename,
    )
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response


@file_bp.route('/files/<int:file_id>', methods=['DELETE'])
@project_access()
def delete_file(project, file):
    file_service.delete_file(project, file, current_user_id())
    return '', 204
