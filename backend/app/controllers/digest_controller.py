"""The daily "due soon" emails. A scheduled GitHub Action calls this once a day
with the shared DIGEST_TOKEN, so no paid cron service is needed."""
import hmac

from flask import Blueprint, current_app, jsonify, request

from app.errors import Forbidden, NotFound
from app.services.email_service import send_due_digests

digest_bp = Blueprint('digest', __name__)


@digest_bp.route('/digest', methods=['POST'])
def send_digest():
    expected = current_app.config.get('DIGEST_TOKEN')
    if not expected:
        raise NotFound()
    given = request.headers.get('X-Digest-Token', '')
    if not hmac.compare_digest(given.encode(), expected.encode()):
        raise Forbidden('Wrong digest token')
    return jsonify({'sent': send_due_digests()}), 200
