from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.file import File

file_bp = Blueprint('files', __name__)


@file_bp.route('/project/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_files(project_id):
    """List all files attached to a project."""
    files = File.query.filter_by(project_id=project_id)\
        .order_by(File.created_at.desc()).all()
    return jsonify({
        'files': [f.to_dict() for f in files]
    }), 200


@file_bp.route('/<int:file_id>', methods=['DELETE'])
@jwt_required()
def delete_file(file_id):
    """Remove a file attachment."""
    user_id = get_jwt_identity()
    file = File.query.filter_by(id=file_id, uploaded_by=user_id).first_or_404()
    db.session.delete(file)
    db.session.commit()
    return jsonify({'message': 'File deleted'}), 200


# TODO: Implement file upload endpoint with size/type validation
# TODO: Add Google Drive OAuth integration
# TODO: Implement file preview generation
