"""One JSON error format for the whole API:

    {"error": {"code": "NOT_FOUND", "message": "Task not found", "details": {}}}

Services raise the AppError subclasses below; the handlers turn them into responses.
"""
import logging

from flask import jsonify
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    status = 400
    code = 'BAD_REQUEST'
    message = 'Bad request'

    def __init__(self, message=None, details=None):
        super().__init__(message or self.message)
        self.message = message or self.message
        self.details = details or {}


class NotFound(AppError):
    status = 404
    code = 'NOT_FOUND'
    message = 'Not found'


class Forbidden(AppError):
    status = 403
    code = 'FORBIDDEN'
    message = 'You do not have access to this'


class Conflict(AppError):
    status = 409
    code = 'CONFLICT'
    message = 'This conflicts with existing data'


class ValidationFailed(AppError):
    status = 400
    code = 'VALIDATION_ERROR'
    message = 'Some fields are invalid'


class ProjectLocked(AppError):
    status = 409
    code = 'PROJECT_LOCKED'
    message = 'This project is locked. Unlock it to make changes.'


class Unauthorized(AppError):
    status = 401
    code = 'UNAUTHORIZED'
    message = 'Please log in'


HTTP_CODES = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    409: 'CONFLICT',
    413: 'PAYLOAD_TOO_LARGE',
    415: 'UNSUPPORTED_MEDIA_TYPE',
    429: 'RATE_LIMITED',
}


def error_response(status, code, message, details=None):
    return jsonify({'error': {'code': code, 'message': message, 'details': details or {}}}), status


def register_error_handlers(app, jwt):
    from app import db

    @app.errorhandler(AppError)
    def handle_app_error(error):
        return error_response(error.status, error.code, error.message, error.details)

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return error_response(400, 'VALIDATION_ERROR', ValidationFailed.message, error.messages)

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        code = HTTP_CODES.get(error.code, 'HTTP_ERROR')
        messages = {413: 'That upload is too big', 429: 'Too many tries. Please wait a minute and try again.'}
        message = messages.get(error.code) or error.description or code
        return error_response(error.code, code, message)

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        db.session.rollback()
        logger.exception('Unhandled error')
        return error_response(500, 'INTERNAL_ERROR', 'Something went wrong on our side')

    def unauthorized(message):
        return error_response(401, 'UNAUTHORIZED', message)

    jwt.unauthorized_loader(lambda reason: unauthorized('Please log in'))
    jwt.invalid_token_loader(lambda reason: unauthorized('Your session is invalid, please log in again'))
    jwt.expired_token_loader(lambda header, payload: unauthorized('Your session expired, please log in again'))
    jwt.user_lookup_error_loader(lambda header, payload: unauthorized('Your account no longer exists'))


class InviteExpired(AppError):
    status = 410
    code = 'INVITE_EXPIRED'
    message = 'This invite has expired. Ask for a new one.'
