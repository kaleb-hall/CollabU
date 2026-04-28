from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from app.services.project_service import ProjectService
from app.schemas.project_schema import (
    ProjectSchema, 
    ProjectCreateSchema, 
    ProjectUpdateSchema,
    AddMemberSchema
)

project_bp = Blueprint('projects', __name__)

# Initialize schemas
project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)
project_create_schema = ProjectCreateSchema()
project_update_schema = ProjectUpdateSchema()
add_member_schema = AddMemberSchema()

@project_bp.route('', methods=['POST'])
@jwt_required()
def create_project():
    """
    Create a new project with optional AI task generation
    POST /api/projects
    Body: { 
        "title": "...", 
        "description": "...", 
        "deadline": "2025-12-31T23:59:59",
        "auto_generate_tasks": true  // Optional
    }
    """
    current_user_id = int(get_jwt_identity())
    
    try:
        data = project_create_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400
    
    auto_generate = request.json.get('auto_generate_tasks', False)
    
    project, task_suggestions, error = ProjectService.create_project(
        data, 
        current_user_id,
        auto_generate_tasks=auto_generate
    )
    
    if error:
        return jsonify({'error': error['message']}), 500
    
    response = {
        'message': 'Project created successfully',
        'project': project_schema.dump(project)
    }
    
    if task_suggestions:
        response['ai_suggestions'] = {
            'project_type': task_suggestions['project_type'],
            'detected': task_suggestions['detected'],
            'tasks_created': len(task_suggestions['tasks']),
            'total_estimated_hours': task_suggestions['total_estimated_hours'],
            'warnings': task_suggestions.get('warnings', [])
        }
    
    return jsonify(response), 201

@project_bp.route('/<int:project_id>/task-suggestions', methods=['GET'])
@jwt_required()
def get_task_suggestions(project_id):
    """
    Get AI task suggestions for an existing project
    GET /api/projects/<id>/task-suggestions
    """
    current_user_id = int(get_jwt_identity())
    
    suggestions, error = ProjectService.get_task_suggestions(project_id, current_user_id)
    
    if error:
        status_code = 404 if error.get('code') == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify(suggestions), 200

@project_bp.route('', methods=['GET'])
@jwt_required()
def get_projects():
    """
    Get all projects for current user
    GET /api/projects
    """
    current_user_id = int(get_jwt_identity())
    projects = ProjectService.get_user_projects(current_user_id)
    
    return jsonify({
        'projects': projects_schema.dump(projects)
    }), 200

@project_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    """
    Get project details
    GET /api/projects/<id>
    """
    current_user_id = int(get_jwt_identity())
    project, error = ProjectService.get_project_by_id(project_id, current_user_id)
    
    if error:
        status_code = 404 if error['code'] == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'project': project_schema.dump(project)
    }), 200

@project_bp.route('/<int:project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    """
    Update a project
    PUT /api/projects/<id>
    Body: { "title": "...", "description": "...", "deadline": "...", "status": "..." }
    """
    current_user_id = int(get_jwt_identity())
    
    try:
        data = project_update_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400
    
    project, error = ProjectService.update_project(project_id, data, current_user_id)
    
    if error:
        status_code = 404 if error['code'] == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'message': 'Project updated successfully',
        'project': project_schema.dump(project)
    }), 200

@project_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    """
    Delete a project
    DELETE /api/projects/<id>
    """
    current_user_id = int(get_jwt_identity())
    success, error = ProjectService.delete_project(project_id, current_user_id)
    
    if error:
        status_code = 404 if error['code'] == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'message': 'Project deleted successfully'
    }), 200

@project_bp.route('/<int:project_id>/members', methods=['POST'])
@jwt_required()
def add_member(project_id):
    """
    Add a member to a project
    POST /api/projects/<id>/members
    Body: { "user_id": 2, "role": "member" }
    """
    current_user_id = int(get_jwt_identity())
    
    try:
        data = add_member_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation error', 'details': err.messages}), 400
    
    member, error = ProjectService.add_member(
        project_id, 
        current_user_id, 
        data['user_id'], 
        data.get('role', 'member')
    )
    
    if error:
        status_code = 404 if error['code'] in ['NOT_FOUND', 'USER_NOT_FOUND'] else 403
        if error['code'] == 'ALREADY_MEMBER':
            status_code = 409
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'message': 'Member added successfully',
        'member': member.to_dict()
    }), 201

@project_bp.route('/<int:project_id>/members/<int:member_id>', methods=['DELETE'])
@jwt_required()
def remove_member(project_id, member_id):
    """
    Remove a member from a project
    DELETE /api/projects/<id>/members/<member_id>
    """
    current_user_id = int(get_jwt_identity())
    success, error = ProjectService.remove_member(project_id, current_user_id, member_id)
    
    if error:
        status_code = 404 if error['code'] == 'NOT_FOUND' else 403
        return jsonify({'error': error['message']}), status_code
    
    return jsonify({
        'message': 'Member removed successfully'
    }), 200
