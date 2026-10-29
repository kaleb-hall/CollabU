import re
from datetime import timedelta

from app import db
from app.models import Invite
from tests.conftest import create_project, get_json, join_project, register


def invite(client, headers, project_id, email='sam@example.com', role='member'):
    return client.post(f'/api/projects/{project_id}/invites', json={'email': email, 'role': role}, headers=headers)


def token_from(email):
    return re.search(r'/invite/(\S+)', email.text).group(1)


def setup(client, outbox):
    ana, headers = register(client)
    project = create_project(client, headers, title='Essay')
    response = invite(client, headers, project['id'])
    assert response.status_code == 201, response.get_json()
    return headers, project, response.get_json()['invite'], token_from(outbox[-1])


def test_invite_sends_email_with_link(client, outbox):
    _, project, created, token = setup(client, outbox)
    assert created['email'] == 'sam@example.com'
    assert created['status'] == 'pending'
    assert 'token' not in created and 'token_hash' not in created
    assert outbox[-1].to == 'sam@example.com'
    assert 'Essay' in outbox[-1].subject
    assert f'http://localhost:5173/invite/{token}' in outbox[-1].text


def test_only_the_token_hash_is_stored(client, outbox):
    _, _, _, token = setup(client, outbox)
    assert Invite.query.one().token_hash != token


def test_anyone_with_the_link_can_see_the_invite(client, outbox):
    _, _, _, token = setup(client, outbox)
    details = get_json(client, f'/api/invites/{token}', {})['invite']
    assert details['project_title'] == 'Essay'
    assert details['inviter_name'] == 'Ana Lee'
    assert details['email'] == 'sam@example.com'
    assert details['status'] == 'pending'
    assert details['has_account'] is False


def test_unknown_token_is_404(client):
    assert client.get('/api/invites/nope').status_code == 404


def test_new_user_registers_then_accepts(client, outbox):
    owner_headers, project, _, token = setup(client, outbox)
    _, sam_headers = register(client, email='Sam@Example.com', first_name='Sam')
    response = client.post(f'/api/invites/{token}/accept', headers=sam_headers)
    assert response.status_code == 200
    assert response.get_json()['project_id'] == project['id']
    assert client.get(f"/api/projects/{project['id']}", headers=sam_headers).status_code == 200
    assert get_json(client, f'/api/invites/{token}', {})['invite']['status'] == 'accepted'
    feed = get_json(client, f"/api/projects/{project['id']}/activity", owner_headers)['activities']
    assert feed[0]['action'] == 'member_joined'


def test_invite_for_a_different_email_cannot_be_used(client, outbox):
    _, project, _, token = setup(client, outbox)
    _, other = register(client, email='lee@example.com')
    response = client.post(f'/api/invites/{token}/accept', headers=other)
    assert response.status_code == 403
    assert 'sam@example.com' in response.get_json()['error']['message']
    assert client.get(f"/api/projects/{project['id']}", headers=other).status_code == 403


def test_accepting_twice_is_harmless(client, outbox):
    _, _, _, token = setup(client, outbox)
    _, sam = register(client, email='sam@example.com')
    assert client.post(f'/api/invites/{token}/accept', headers=sam).status_code == 200
    assert client.post(f'/api/invites/{token}/accept', headers=sam).status_code == 200


def test_expired_invite_cannot_be_accepted(client, outbox):
    _, _, _, token = setup(client, outbox)
    stored = Invite.query.one()
    stored.expires_at = stored.created_at - timedelta(seconds=1)
    db.session.commit()
    _, sam = register(client, email='sam@example.com')
    response = client.post(f'/api/invites/{token}/accept', headers=sam)
    assert response.status_code == 410
    assert response.get_json()['error']['code'] == 'INVITE_EXPIRED'


def test_accept_requires_login(client, outbox):
    _, _, _, token = setup(client, outbox)
    assert client.post(f'/api/invites/{token}/accept').status_code == 401


def test_has_account_when_email_is_registered(client, outbox):
    register(client, email='sam@example.com')
    _, _, _, token = setup(client, outbox)
    assert get_json(client, f'/api/invites/{token}', {})['invite']['has_account'] is True


def test_reinviting_replaces_the_old_link(client, outbox):
    headers, project, _, old_token = setup(client, outbox)
    assert invite(client, headers, project['id'], email='SAM@example.com').status_code == 201
    new_token = token_from(outbox[-1])
    assert Invite.query.count() == 1
    assert client.get(f'/api/invites/{old_token}').status_code == 404
    assert client.get(f'/api/invites/{new_token}').status_code == 200


def test_cannot_invite_an_existing_member(client, outbox):
    ana, headers = register(client)
    project = create_project(client, headers)
    response = invite(client, headers, project['id'], email='ana@example.com')
    assert response.status_code == 409


def test_only_admins_can_invite_and_see_invites(client, outbox):
    headers, project, _, _ = setup(client, outbox)
    member, member_headers = register(client, email='lee@example.com')
    join_project(project['id'], member['id'])
    assert invite(client, member_headers, project['id'], email='x@example.com').status_code == 403
    assert client.get(f"/api/projects/{project['id']}/invites", headers=member_headers).status_code == 403


def test_admin_lists_and_cancels_pending_invites(client, outbox):
    headers, project, created, token = setup(client, outbox)
    pending = get_json(client, f"/api/projects/{project['id']}/invites", headers)['invites']
    assert [i['email'] for i in pending] == ['sam@example.com']

    response = client.delete(f"/api/projects/{project['id']}/invites/{created['id']}", headers=headers)
    assert response.status_code == 204
    assert get_json(client, f"/api/projects/{project['id']}/invites", headers)['invites'] == []
    assert client.get(f'/api/invites/{token}').status_code == 404


def test_invite_email_must_be_valid(client):
    _, headers = register(client)
    project = create_project(client, headers)
    assert invite(client, headers, project['id'], email='not-an-email').status_code == 400


def test_user_list_and_add_by_id_are_gone(client):
    ana, headers = register(client)
    project = create_project(client, headers)
    assert client.get('/api/users', headers=headers).status_code in (404, 405)
    response = client.post(f"/api/projects/{project['id']}/members", json={'user_id': ana['id']}, headers=headers)
    assert response.status_code in (404, 405)
