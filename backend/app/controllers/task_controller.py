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

# Initialize schemas
task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)
task_create_schema = TaskCreateSchema()
task_update_schema = TaskUpdateSchema()
task_status_schema = TaskStatusUpdateSchema()

@task_bp.route('/project/<int:project_id>', methods=['POST'])
@jwt_required()
def create_task(project_id):
    """
    Create a new task in a project
    POST /api/tasks/project/<project_id>
    Body: {
        "title": "...",
        "description": "...",
        "due_date": "2025-12-31T23:59:59",
        "start_date": "2025-12-01T00:00:00",
        "estimated_hours": 5.0,
        "priority": "high",
        "assigned_to": 2
    }
    """
    current_user_id = int(get_jwt_identity())
    
    try:
        data = task_create_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400
    
    task, error = TaskService.create_task(project_id, data, current_user_id)
    
    if error:
        status_code = 403 if error['code'] == 'FORBIDDEN' else 400
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'message': 'Task created successfully',
        'task': task_schema.dump(task)
    }), 201

@task_bp.route('/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_tasks(project_id):
    """
    Get all tasks for a project
    GET /api/tasks/project/<project_id>
    Optional query params: ?status=todo&assigned_to=2&priority=high
    """
    current_user_id = int(get_jwt_identity())
    
    # Get filters from query params
    filters = {
        'status': request.args.get('status'),
        'assigned_to': request.args.get('assigned_to', type=int),
        'priority': request.args.get('priority')
    }
    # Remove None values
    filters = {k: v for k, v in filters.items() if v is not None}
    
    tasks, error = TaskService.get_project_tasks(project_id, current_user_id, filters)
    
    if error:
        return jsonify({'error': error['message']}), 403
    
    return jsonify({
        'tasks': tasks_schema.dump(tasks),
        'count': len(tasks)
    }), 200

@task_bp.route('/my-tasks', methods=['GET'])
@jwt_required()
def get_my_tasks():
    """
    Get all tasks assigned to current user
    GET /api/tasks/my-tasks
    Optional query params: ?status=todo&priority=high
    """
    current_user_id = int(get_jwt_identity())
    
    # Get filters from query params
    filters = {
        'status': request.args.get('status'),
        'priority': request.args.get('priority')
    }
    # Remove None values
    filters = {k: v for k, v in filters.items() if v is not None}
    
    tasks = TaskService.get_user_tasks(current_user_id, filters)
    
    return jsonify({
        'tasks': tasks_schema.dump(tasks),
        'count': len(tasks)
    }), 200

@task_bp.route('/<int:task_id>', methods=['GET'])
@jwt_required()
def get_task(task_id):
    """
    Get specific task details
    GET /api/tasks/<task_id>
    """
    current_user_id = int(get_jwt_identity())
    
    task, error = TaskService.get_task_by_id(task_id, current_user_id)
    
    if error:
        status_code = 404 if error['code'] == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'task': task_schema.dump(task)
    }), 200

@task_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    """
    Update a task
    PUT /api/tasks/<task_id>
    Body: {
        "title": "...",
        "description": "...",
        "status": "in_progress",
        "priority": "urgent",
        "assigned_to": 3
    }
    """
    current_user_id = int(get_jwt_identity())
    
    try:
        data = task_update_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400
    
    task, error = TaskService.update_task(task_id, data, current_user_id)
    
    if error:
        status_code = 404 if error['code'] == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'message': 'Task updated successfully',
        'task': task_schema.dump(task)
    }), 200

@task_bp.route('/<int:task_id>/status', methods=['PUT'])
@jwt_required()
def update_task_status(task_id):
    """
    Quick update task status
    PUT /api/tasks/<task_id>/status
    Body: { "status": "completed" }
    """
    current_user_id = int(get_jwt_identity())
    
    try:
        data = task_status_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400
    
    task, error = TaskService.update_task(task_id, data, current_user_id)
    
    if error:
        status_code = 404 if error['code'] == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'message': 'Task status updated successfully',
        'task': task_schema.dump(task)
    }), 200

@task_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    """
    Delete a task
    DELETE /api/tasks/<task_id>
    """
    current_user_id = int(get_jwt_identity())
    
    success, error = TaskService.delete_task(task_id, current_user_id)
    
    if error:
        status_code = 404 if error['code'] == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'message': 'Task deleted successfully'
    }), 200
