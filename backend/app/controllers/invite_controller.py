from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from app.schemas.invite_schema import InviteCreateSchema, InviteSchema
from app.services import invite_service
from app.utils.auth import current_user_id
from app.utils.permissions import project_access
from app.utils.request_data import load_json

invite_bp = Blueprint('invites', __name__)

invite_schema = InviteSchema()


@invite_bp.route('/projects/<int:project_id>/invites', methods=['POST'])
@project_access(admin=True)
def create_invite(project):
    data = load_json(InviteCreateSchema())
    invite = invite_service.create_invite(project, data['email'], data['role'], current_user_id())
    return jsonify({'invite': invite_schema.dump(invite)}), 201


@invite_bp.route('/projects/<int:project_id>/invites', methods=['GET'])
@project_access(admin=True)
def list_invites(project):
    return jsonify({'invites': invite_schema.dump(invite_service.pending_invites(project), many=True)}), 200


@invite_bp.route('/projects/<int:project_id>/invites/<int:invite_id>', methods=['DELETE'])
@project_access(admin=True)
def cancel_invite(project, invite_id):
    invite_service.cancel(project, invite_id)
    return '', 204


@invite_bp.route('/invites/<token>', methods=['GET'])
def get_invite(token):
    """Public: the token itself is the proof. Lets the invite page show who invited you."""
    return jsonify({'invite': invite_service.describe(invite_service.find_by_token(token))}), 200


@invite_bp.route('/invites/<token>/accept', methods=['POST'])
@jwt_required()
def accept_invite(token):
    project = invite_service.accept(token, current_user_id())
    return jsonify({'project_id': project.id}), 200
