from flask import Blueprint, jsonify

from app.schemas.comment_schema import CommentCreateSchema, CommentSchema
from app.services import comment_service
from app.utils.auth import current_user_id
from app.utils.permissions import project_access
from app.utils.request_data import load_json

comment_bp = Blueprint('comments', __name__)

comment_schema = CommentSchema()


@comment_bp.route('/<int:task_id>/comments', methods=['GET'])
@project_access()
def list_comments(project, task):
    return jsonify({'comments': comment_schema.dump(comment_service.comments_for(task), many=True)}), 200


@comment_bp.route('/<int:task_id>/comments', methods=['POST'])
@project_access()
def add_comment(project, task):
    data = load_json(CommentCreateSchema())
    comment = comment_service.add_comment(task, current_user_id(), data['body'])
    return jsonify({'comment': comment_schema.dump(comment)}), 201


@comment_bp.route('/<int:task_id>/comments/<int:comment_id>', methods=['DELETE'])
@project_access()
def delete_comment(project, task, comment_id):
    comment_service.delete_comment(task, comment_id, current_user_id())
    return '', 204
