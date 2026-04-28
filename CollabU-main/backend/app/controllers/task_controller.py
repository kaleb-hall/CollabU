from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from app.services.task_service import TaskService
from app.schemas.task_schema import (
    TaskSchema,
    TaskCreateSchema,
    TaskUpdateSchema,
    TaskStatusUpdateSchema
)

task_bp = Blueprint('tasks', __name__)

task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)
task_create_schema = TaskCreateSchema()
task_update_schema = TaskUpdateSchema()
task_status_update_schema = TaskStatusUpdateSchema()

@task_bp.route('/project/<int:project_id>', methods=['POST'])
@jwt_required()
def create_task(project_id):
    """Create a new task"""
    current_user_id = int(get_jwt_identity())
    
    try:
        data = task_create_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400
    
    task, error = TaskService.create_task(data, project_id, current_user_id)
    
    if error:
        status_code = 403 if error.get('code') == 'FORBIDDEN' else 500
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'message': 'Task created successfully',
        'task': task_schema.dump(task)
    }), 201

@task_bp.route('/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_tasks(project_id):
    """Get all tasks for a project"""
    current_user_id = int(get_jwt_identity())
    
    tasks, error = TaskService.get_project_tasks(project_id, current_user_id)
    
    if error:
        return jsonify({'error': error['message']}), 403
    
    return jsonify({
        'tasks': tasks_schema.dump(tasks)
    }), 200

@task_bp.route('/my-tasks', methods=['GET'])
@jwt_required()
def get_my_tasks():
    """Get all tasks assigned to current user"""
    current_user_id = int(get_jwt_identity())
    
    tasks, error = TaskService.get_my_tasks(current_user_id)
    
    if error:
        return jsonify({'error': error['message']}), 500
    
    return jsonify({
        'tasks': tasks_schema.dump(tasks)
    }), 200

@task_bp.route('/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    """Get a specific task"""
    current_user_id = int(get_jwt_identity())
    
    from app.models import Task
    task = Task.query.get(task_id)
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    # Check access
    from app.models import ProjectMember
    member = ProjectMember.query.filter_by(
        project_id=task.project_id,
        user_id=current_user_id
    ).first()
    
    if not member:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({
        'task': task_schema.dump(task)
    }), 200

@task_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    """Update a task"""
    current_user_id = int(get_jwt_identity())
    
    try:
        data = task_update_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400
    
    task, error = TaskService.update_task(task_id, data, current_user_id)
    
    if error:
        status_code = 404 if error.get('code') == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'message': 'Task updated successfully',
        'task': task_schema.dump(task)
    }), 200

@task_bp.route('/<int:task_id>/status', methods=['PUT'])
@jwt_required()
def update_task_status(task_id):
    """Update task status"""
    current_user_id = int(get_jwt_identity())
    
    try:
        data = task_status_update_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400
    
    task, error = TaskService.update_task(task_id, data, current_user_id)
    
    if error:
        status_code = 404 if error.get('code') == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'message': 'Task status updated successfully',
        'task': task_schema.dump(task)
    }), 200

@task_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    """Delete a task"""
    current_user_id = int(get_jwt_identity())
    
    success, error = TaskService.delete_task(task_id, current_user_id)
    
    if error:
        status_code = 404 if error.get('code') == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'message': 'Task deleted successfully'
    }), 200

@task_bp.route('/project/<int:project_id>/calculate-schedule', methods=['POST'])
@jwt_required()
def calculate_schedule(project_id):
    """Calculate optimal task schedule"""
    current_user_id = int(get_jwt_identity())
    
    # Import the deadline algorithm
    from app.utils.deadline_algorithm import DeadlineAlgorithm
    
    algorithm = DeadlineAlgorithm()
    result, error = algorithm.calculate_schedule(project_id, current_user_id)
    
    if error:
        status_code = 404 if error.get('code') == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify(result), 200
