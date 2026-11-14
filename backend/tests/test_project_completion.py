"""Finishing a project: complete, reopen, lock, archive, the final note and the summary."""
import io

from tests.conftest import create_project, create_task, get_json, join_project, register


def setup_team(client):
    owner, owner_headers = register(client)
    member, member_headers = register(client, email='leo@example.com', first_name='Leo', last_name='Park')
    project = create_project(client, owner_headers)
    join_project(project['id'], member['id'])
    return project, (owner, owner_headers), (member, member_headers)


def finish(client, headers, task_id):
    response = client.put(f'/api/tasks/{task_id}/status', json={'status': 'completed'}, headers=headers)
    assert response.status_code == 200, response.get_json()


# Completing and reopening

def test_creator_can_complete_with_open_tasks(client):
    project, (owner, owner_headers), _ = setup_team(client)
    create_task(client, owner_headers, project['id'])

    response = client.post(f"/api/projects/{project['id']}/complete", headers=owner_headers)

    assert response.status_code == 200
    body = response.get_json()['project']
    assert body['status'] == 'completed'
    assert body['locked'] is True
    assert body['completed_at'].endswith('Z')
    assert body['completed_by'] == owner['id']


def test_member_cannot_complete_while_tasks_are_open(client):
    project, (_, owner_headers), (_, member_headers) = setup_team(client)
    create_task(client, owner_headers, project['id'])

    response = client.post(f"/api/projects/{project['id']}/complete", headers=member_headers)

    assert response.status_code == 403
    assert 'tasks are done' in response.get_json()['error']['message']


def test_member_can_complete_once_every_task_is_done(client):
    project, (_, owner_headers), (_, member_headers) = setup_team(client)
    task = create_task(client, owner_headers, project['id'])
    finish(client, owner_headers, task['id'])

    response = client.post(f"/api/projects/{project['id']}/complete", headers=member_headers)

    assert response.status_code == 200


def test_completing_twice_is_a_conflict(client):
    project, (_, owner_headers), _ = setup_team(client)
    client.post(f"/api/projects/{project['id']}/complete", headers=owner_headers)

    response = client.post(f"/api/projects/{project['id']}/complete", headers=owner_headers)

    assert response.status_code == 409


def test_reopen_unlocks_and_clears_completion(client):
    project, (_, owner_headers), (_, member_headers) = setup_team(client)
    client.post(f"/api/projects/{project['id']}/complete", headers=owner_headers)

    assert client.post(f"/api/projects/{project['id']}/reopen", headers=member_headers).status_code == 403
    response = client.post(f"/api/projects/{project['id']}/reopen", headers=owner_headers)

    body = response.get_json()['project']
    assert body['status'] == 'active'
    assert body['locked'] is False
    assert body['completed_at'] is None


def test_status_can_no_longer_be_set_through_edit(client):
    project, (_, owner_headers), _ = setup_team(client)

    response = client.put(f"/api/projects/{project['id']}", json={'status': 'completed'}, headers=owner_headers)

    assert response.status_code == 400


# Locking

def test_admin_can_lock_and_unlock(client):
    project, (_, owner_headers), (_, member_headers) = setup_team(client)
    url = f"/api/projects/{project['id']}/lock"

    assert client.put(url, json={'locked': True}, headers=member_headers).status_code == 403
    assert client.put(url, json={'locked': True}, headers=owner_headers).get_json()['project']['locked'] is True
    assert client.put(url, json={'locked': False}, headers=owner_headers).get_json()['project']['locked'] is False


def test_a_locked_project_refuses_edits(client):
    project, (_, owner_headers), _ = setup_team(client)
    task = create_task(client, owner_headers, project['id'])
    client.put(f"/api/projects/{project['id']}/lock", json={'locked': True}, headers=owner_headers)

    attempts = [
        client.post(f"/api/tasks/project/{project['id']}", json={'title': 'New', 'due_date': '2030-01-10T12:00:00'},
                    headers=owner_headers),
        client.put(f"/api/tasks/{task['id']}", json={'title': 'Renamed'}, headers=owner_headers),
        client.put(f"/api/tasks/{task['id']}/status", json={'status': 'completed'}, headers=owner_headers),
        client.delete(f"/api/tasks/{task['id']}", headers=owner_headers),
        client.put(f"/api/projects/{project['id']}", json={'title': 'Renamed'}, headers=owner_headers),
        client.post(f"/api/projects/{project['id']}/invites", json={'email': 'sam@example.com'}, headers=owner_headers),
        client.post(f"/api/projects/{project['id']}/schedule", json={}, headers=owner_headers),
    ]

    for response in attempts:
        assert response.status_code == 409, response.request.path
        assert response.get_json()['error']['code'] == 'PROJECT_LOCKED'


def test_a_locked_project_still_allows_comments_and_reading(client):
    project, (_, owner_headers), _ = setup_team(client)
    task = create_task(client, owner_headers, project['id'])
    client.put(f"/api/projects/{project['id']}/lock", json={'locked': True}, headers=owner_headers)

    comment = client.post(f"/api/tasks/{task['id']}/comments", json={'body': 'Nice work'}, headers=owner_headers)

    assert comment.status_code == 201
    get_json(client, f"/api/tasks/project/{project['id']}", owner_headers)


# Archiving

def test_admin_can_archive_and_it_still_lists(client):
    project, (_, owner_headers), (_, member_headers) = setup_team(client)
    url = f"/api/projects/{project['id']}/archive"

    assert client.put(url, json={'archived': True}, headers=member_headers).status_code == 403
    archived = client.put(url, json={'archived': True}, headers=owner_headers).get_json()['project']
    assert archived['archived_at'].endswith('Z')

    listed = get_json(client, '/api/projects', member_headers)['projects']
    assert listed[0]['archived_at'] == archived['archived_at']

    restored = client.put(url, json={'archived': False}, headers=owner_headers).get_json()['project']
    assert restored['archived_at'] is None


# Updates that matter

def test_team_hears_when_someone_finishes_all_their_tasks(client, outbox):
    project, (owner, owner_headers), (member, member_headers) = setup_team(client)
    first = create_task(client, owner_headers, project['id'], assigned_to=member['id'])
    second = create_task(client, owner_headers, project['id'], assigned_to=member['id'])
    outbox.clear()

    finish(client, member_headers, first['id'])
    assert not any('finished all' in n['title'] for n in get_json(client, '/api/notifications', owner_headers)['notifications'])

    finish(client, member_headers, second['id'])
    titles = [n['title'] for n in get_json(client, '/api/notifications', owner_headers)['notifications']]
    assert 'Leo Park finished all their tasks in Group essay' in titles
    assert [email.to for email in outbox] == ['ana@example.com']


def test_team_hears_when_the_project_is_completed(client, outbox):
    project, (_, owner_headers), (_, member_headers) = setup_team(client)
    outbox.clear()

    client.post(f"/api/projects/{project['id']}/complete", headers=owner_headers)

    titles = [n['title'] for n in get_json(client, '/api/notifications', member_headers)['notifications']]
    assert 'Group essay is complete' in titles
    assert [email.to for email in outbox] == ['leo@example.com']


def test_email_updates_can_be_turned_off_per_project(client, outbox):
    project, (_, owner_headers), (_, member_headers) = setup_team(client)

    response = client.put(f"/api/projects/{project['id']}/my-settings", json={'email_updates': False},
                          headers=member_headers)
    assert response.status_code == 200
    assert response.get_json()['email_updates'] is False
    outbox.clear()

    client.post(f"/api/projects/{project['id']}/complete", headers=owner_headers)

    assert outbox == []
    titles = [n['title'] for n in get_json(client, '/api/notifications', member_headers)['notifications']]
    assert 'Group essay is complete' in titles


def test_my_email_setting_is_shown_on_the_project(client):
    project, _, (member, member_headers) = setup_team(client)

    members = get_json(client, f"/api/projects/{project['id']}", member_headers)['project']['members']

    mine = next(m for m in members if m['user_id'] == member['id'])
    assert mine['email_updates'] is True


# The final note

def test_final_note_goes_to_the_team_once(client, outbox):
    project, (_, owner_headers), (_, member_headers) = setup_team(client)
    url = f"/api/projects/{project['id']}/final-note"

    assert client.post(url, json={'message': 'Too early'}, headers=owner_headers).status_code == 409
    client.post(f"/api/projects/{project['id']}/complete", headers=owner_headers)
    outbox.clear()

    response = client.post(url, json={'message': 'Thanks everyone, great work!'}, headers=owner_headers)

    assert response.status_code == 200
    assert response.get_json()['project']['final_note'] == 'Thanks everyone, great work!'
    notes = [n for n in get_json(client, '/api/notifications', member_headers)['notifications']
             if n['title'] == 'Ana Lee sent a final note on Group essay']
    assert notes[0]['message'] == 'Thanks everyone, great work!'
    assert [email.to for email in outbox] == ['leo@example.com']
    assert client.post(url, json={'message': 'Again'}, headers=owner_headers).status_code == 409


def test_only_the_finisher_or_an_admin_sends_the_final_note(client):
    project, (_, owner_headers), (_, member_headers) = setup_team(client)
    client.post(f"/api/projects/{project['id']}/complete", headers=owner_headers)

    response = client.post(f"/api/projects/{project['id']}/final-note", json={'message': 'Hi'}, headers=member_headers)

    assert response.status_code == 403


def test_final_note_cannot_be_blank(client):
    project, (_, owner_headers), _ = setup_team(client)
    client.post(f"/api/projects/{project['id']}/complete", headers=owner_headers)

    response = client.post(f"/api/projects/{project['id']}/final-note", json={'message': '  '}, headers=owner_headers)

    assert response.status_code == 400


# The summary

def test_summary_lists_tasks_contributors_and_files(client):
    project, (owner, owner_headers), (member, member_headers) = setup_team(client)
    done = create_task(client, owner_headers, project['id'], title='Draft', assigned_to=member['id'])
    create_task(client, owner_headers, project['id'], title='Unfinished')
    finish(client, member_headers, done['id'])
    client.post(f"/api/projects/{project['id']}/files", headers=owner_headers,
                data={'file': (io.BytesIO(b'%PDF-1.4 test'), 'essay.pdf')},
                content_type='multipart/form-data')
    client.post(f"/api/projects/{project['id']}/complete", headers=owner_headers)

    summary = get_json(client, f"/api/projects/{project['id']}/summary", member_headers)

    assert summary['started_at'].endswith('Z')
    assert summary['completed_at'].endswith('Z')
    assert summary['completed_by']['id'] == owner['id']
    assert [t['title'] for t in summary['completed_tasks']] == ['Draft']
    assert summary['completed_tasks'][0]['assignee']['id'] == member['id']
    assert summary['open_task_count'] == 1
    assert summary['contributors'] == [{'user': summary['completed_tasks'][0]['assignee'], 'tasks_completed': 1}]
    assert [f['filename'] for f in summary['files']] == ['essay.pdf']
