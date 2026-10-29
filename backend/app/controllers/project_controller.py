from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.schemas.activity_schema import ActivitySchema
from app.schemas.project_schema import (
    ProjectCreateSchema,
    ProjectSchema,
    ProjectUpdateSchema,
    ScheduleRequestSchema,
    TaskSummarySchema,
)
from app.models import Activity
from app.services import activity_service, deadline_service, project_service, task_templates
from app.utils.auth import current_user_id
from app.utils.pagination import PageArgsSchema, paginate
from app.utils.permissions import project_access
from app.utils.request_data import load_json

project_bp = Blueprint('projects', __name__)

project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)
summary_schema = TaskSummarySchema()


@project_bp.route('', methods=['POST'])
@jwt_required()
def create_project():
    data = load_json(ProjectCreateSchema())
    project, suggestions = project_service.create_project(
        data, current_user_id(), data.pop('auto_generate_tasks'), data.pop('template')
    )

    response = {'project': project_schema.dump(project)}
    if suggestions:
        response['suggestions'] = {
            'project_type': suggestions['project_type'],
            'detected': suggestions['detected'],
            'tasks_created': len(suggestions['tasks']),
            'total_estimated_hours': suggestions['total_estimated_hours'],
            'warnings': suggestions['warnings'],
        }
    return jsonify(response), 201


@project_bp.route('', methods=['GET'])
@jwt_required()
def list_projects():
    projects = project_service.projects_for_user(current_user_id())
    summaries = project_service.task_summaries([project.id for project in projects])
    return jsonify({'projects': [
        {**project_schema.dump(project), **summary_schema.dump(summaries[project.id])} for project in projects
    ]}), 200


@project_bp.route('/<int:project_id>', methods=['GET'])
@project_access()
def get_project(project):
    return jsonify({'project': project_schema.dump(project)}), 200


@project_bp.route('/<int:project_id>/task-suggestions', methods=['GET'])
@project_access()
def get_task_suggestions(project):
    return jsonify(task_templates.serialize(project_service.task_suggestions(project))), 200


@project_bp.route('/<int:project_id>', methods=['PUT'])
@project_access(admin=True)
def update_project(project):
    project = project_service.update_project(project, load_json(ProjectUpdateSchema()))
    return jsonify({'project': project_schema.dump(project)}), 200


@project_bp.route('/<int:project_id>', methods=['DELETE'])
@project_access(admin=True)
def delete_project(project):
    project_service.delete_project(project)
    return '', 204


@project_bp.route('/<int:project_id>/members/<int:member_id>', methods=['DELETE'])
@project_access(admin=True)
def remove_member(project, member_id):
    project_service.remove_member(project, member_id)
    return '', 204


@project_bp.route('/<int:project_id>/schedule', methods=['POST'])
@project_access()
def calculate_schedule(project):
    data = ScheduleRequestSchema().load(request.get_json(silent=True) or {})
    schedule, warnings = deadline_service.calculate_task_schedule(project, data['timezone'])
    return jsonify({'schedule': schedule, 'warnings': warnings}), 200


@project_bp.route('/<int:project_id>/activity', methods=['GET'])
@project_access()
def list_activity(project):
    args = PageArgsSchema().load(request.args)
    activities, next_cursor = paginate(activity_service.feed_query(project), Activity, args)
    return jsonify({'activities': ActivitySchema(many=True).dump(activities), 'next_cursor': next_cursor}), 200
