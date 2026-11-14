"""Inviting people to a project by email.

The email holds a random token; the database only keeps its SHA-256 hash, so a
leaked database cannot be used to join projects.
"""
import hashlib
import secrets
from datetime import timedelta

from app import db
from app.errors import Conflict, Forbidden, InviteExpired, NotFound
from app.models import Invite, ProjectMember, User
from app.services import email_service, project_service
from app.services.auth_service import find_by_email
from app.utils.time import utcnow

INVITE_LIFETIME = timedelta(days=7)


def hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


def create_invite(project, email, role, inviter_id):
    email = email.strip().lower()
    existing_user = find_by_email(email)
    if existing_user and ProjectMember.query.filter_by(project_id=project.id, user_id=existing_user.id).first():
        raise Conflict('That person is already a member')

    # A new invite replaces any earlier one, so only the newest link works.
    Invite.query.filter_by(project_id=project.id, email=email, accepted_at=None).delete()

    token = secrets.token_urlsafe(32)
    invite = Invite(
        project_id=project.id,
        email=email,
        role=role,
        token_hash=hash_token(token),
        invited_by=inviter_id,
        expires_at=utcnow() + INVITE_LIFETIME,
    )
    db.session.add(invite)
    db.session.commit()
    email_service.send_invite(invite, token, project, invite.inviter)
    return invite


def find_by_token(token):
    invite = Invite.query.filter_by(token_hash=hash_token(token)).first()
    if not invite:
        raise NotFound('This invite link is not valid. It may have been replaced or cancelled.')
    return invite


def describe(invite):
    return {
        'project_title': invite.project.title,
        'inviter_name': f'{invite.inviter.first_name} {invite.inviter.last_name}',
        'email': invite.email,
        'role': invite.role,
        'status': invite.status,
        'has_account': find_by_email(invite.email) is not None,
    }


def accept(token, user_id):
    invite = find_by_token(token)
    user = db.session.get(User, user_id)
    is_member = ProjectMember.query.filter_by(project_id=invite.project_id, user_id=user_id).first()

    if invite.status == 'accepted' and is_member:
        return invite.project
    if invite.status == 'expired':
        raise InviteExpired()
    if invite.status == 'accepted':
        raise InviteExpired('This invite was already used.')
    if user.email.lower() != invite.email:
        raise Forbidden(f'This invite was sent to {invite.email}. Log in with that email to accept it.')

    if not is_member:
        project_service.add_member(invite.project, user_id, invite.role)
    invite.accepted_at = utcnow()
    db.session.commit()
    return invite.project


def pending_invites(project):
    invites = Invite.query.filter_by(project_id=project.id, accepted_at=None).order_by(Invite.created_at).all()
    return [invite for invite in invites if invite.status == 'pending']


def cancel(project, invite_id):
    invite = Invite.query.filter_by(id=invite_id, project_id=project.id, accepted_at=None).first()
    if not invite:
        raise NotFound('Invite not found')
    db.session.delete(invite)
    db.session.commit()
