from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.deadline_service import DeadlineService
from app.models.project_member import ProjectMember

deadline_bp = Blueprint('deadline', __name__)

@deadline_bp.route('/projects/<int:project_id>/calculate-schedule', methods=['POST'])
@jwt_required()
def calculate_schedule(project_id):
    """
    Calculate optimal schedule for all tasks in a project
    POST /api/deadline/projects/<project_id>/calculate-schedule
    
    This is the MAGIC endpoint! 🪄
    """
    current_user_id = int(get_jwt_identity())
    
    # Check if user is a member of the project
    member = ProjectMember.query.filter_by(
        project_id=project_id,
        user_id=current_user_id
    ).first()
    
    if not member:
        return jsonify({'error': 'Access denied'}), 403
    
    # Run the algorithm!
    schedule, warnings, error = DeadlineService.calculate_task_schedule(project_id)
    
    if error:
        status_code = 404 if error['code'] == 'NOT_FOUND' else 500
        return jsonify({'error': error['message']}), status_code
    
    response = {
        'message': 'Schedule calculated successfully',
        'schedule': schedule
    }
    
    if warnings:
        response['warnings'] = warnings
    
    return jsonify(response), 200
