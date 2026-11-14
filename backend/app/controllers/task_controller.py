from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from app.schemas.task_schema import MyTaskSchema, TaskCreateSchema, TaskSchema, TaskStatusUpdateSchema, TaskUpdateSchema
from app.services import task_service
from app.utils.auth import current_user_id
from app.utils.permissions import project_access
from app.utils.request_data import load_json

task_bp = Blueprint('tasks', __name__)

task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)
my_tasks_schema = MyTaskSchema(many=True)


@task_bp.route('/project/<int:project_id>', methods=['POST'])
@project_access(editable=True)
def create_task(project):
    task = task_service.create_task(project, load_json(TaskCreateSchema()), current_user_id())
    return jsonify({'task': task_schema.dump(task)}), 201


@task_bp.route('/project/<int:project_id>', methods=['GET'])
@project_access()
def list_project_tasks(project):
    return jsonify({'tasks': tasks_schema.dump(task_service.tasks_for_project(project))}), 200


@task_bp.route('/my-tasks', methods=['GET'])
@jwt_required()
def list_my_tasks():
    return jsonify({'tasks': my_tasks_schema.dump(task_service.tasks_for_user(current_user_id()))}), 200


@task_bp.route('/<int:task_id>', methods=['GET'])
@project_access()
def get_task(project, task):
    return jsonify({'task': task_schema.dump(task)}), 200


@task_bp.route('/<int:task_id>', methods=['PUT'])
@project_access(editable=True)
def update_task(project, task):
    task = task_service.update_task(task, load_json(TaskUpdateSchema()), current_user_id())
    return jsonify({'task': task_schema.dump(task)}), 200


@task_bp.route('/<int:task_id>/status', methods=['PUT'])
@project_access(editable=True)
def update_task_status(project, task):
    task = task_service.update_task(task, load_json(TaskStatusUpdateSchema()), current_user_id())
    return jsonify({'task': task_schema.dump(task)}), 200


@task_bp.route('/<int:task_id>', methods=['DELETE'])
@project_access(editable=True)
def delete_task(project, task):
    task_service.delete_task(task)
    return '', 204

