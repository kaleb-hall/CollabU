from datetime import datetime, timedelta, timezone

from tests.conftest import create_project, create_task, get_json, join_project, register


def iso_from_now(**delta):
    return (datetime.now(timezone.utc) + timedelta(**delta)).strftime('%Y-%m-%dT%H:%M:%SZ')


def inbox(client, headers, query=''):
    return get_json(client, f'/api/notifications{query}', headers)


def titles(client, headers):
    return [n['title'] for n in inbox(client, headers)['notifications']]


def team(client):
    ana, ana_headers = register(client)
    sam, sam_headers = register(client, email='sam@example.com', first_name='Sam', last_name='Kim')
    project = create_project(client, ana_headers, title='Essay')
    join_project(project['id'], sam['id'])
    return ana, ana_headers, sam, sam_headers, project


def test_owner_is_told_when_someone_joins(client):
    _, ana_headers, _, sam_headers, _ = team(client)
    assert titles(client, ana_headers) == ['Sam Kim joined Essay']
    assert titles(client, sam_headers) == []


def test_assignee_is_told_when_assigned(client):
    _, ana_headers, sam, sam_headers, project = team(client)
    create_task(client, ana_headers, project['id'], title='Outline', assigned_to=sam['id'])
    task = create_task(client, ana_headers, project['id'], title='Sources')
    client.put(f"/api/tasks/{task['id']}", json={'assigned_to': sam['id']}, headers=ana_headers)

    notifications = inbox(client, sam_headers)['notifications']
    assert [n['title'] for n in notifications] == ['You were assigned "Sources"', 'You were assigned "Outline"']
    assert notifications[0]['type'] == 'assignment'
    assert notifications[0]['link'] == f"/projects/{project['id']}"


def test_assigning_yourself_does_not_notify(client):
    ana, ana_headers, _, _, project = team(client)
    create_task(client, ana_headers, project['id'], assigned_to=ana['id'])
    assert titles(client, ana_headers) == ['Sam Kim joined Essay']


def test_creator_is_told_when_their_task_moves_to_review(client):
    _, ana_headers, _, sam_headers, project = team(client)
    task = create_task(client, ana_headers, project['id'], title='Outline')
    client.put(f"/api/tasks/{task['id']}/status", json={'status': 'in_progress'}, headers=sam_headers)
    client.put(f"/api/tasks/{task['id']}/status", json={'status': 'review'}, headers=sam_headers)
    assert titles(client, ana_headers)[0] == '"Outline" is ready for review'


def test_moving_your_own_task_to_review_does_not_notify(client):
    _, ana_headers, _, _, project = team(client)
    task = create_task(client, ana_headers, project['id'])
    client.put(f"/api/tasks/{task['id']}/status", json={'status': 'review'}, headers=ana_headers)
    assert titles(client, ana_headers) == ['Sam Kim joined Essay']


def test_due_soon_reminder_appears_once(client):
    ana, ana_headers, _, _, project = team(client)
    create_task(client, ana_headers, project['id'], title='Soon', assigned_to=ana['id'], due_date=iso_from_now(hours=5))
    create_task(client, ana_headers, project['id'], title='Later', assigned_to=ana['id'], due_date=iso_from_now(days=3))
    done = create_task(client, ana_headers, project['id'], title='Done', assigned_to=ana['id'], due_date=iso_from_now(hours=2))
    client.put(f"/api/tasks/{done['id']}/status", json={'status': 'completed'}, headers=ana_headers)

    titles(client, ana_headers)
    titles(client, ana_headers)
    assert titles(client, ana_headers).count('"Soon" is due within 24 hours') == 1
    assert not any('Later' in t or 'Done' in t for t in titles(client, ana_headers))


def test_due_soon_is_created_by_unread_count_poll(client):
    ana, ana_headers, _, _, project = team(client)
    create_task(client, ana_headers, project['id'], title='Soon', assigned_to=ana['id'], due_date=iso_from_now(hours=5))
    assert get_json(client, '/api/notifications/unread-count', ana_headers)['unread_count'] == 2


def test_mark_one_and_all_read(client):
    _, ana_headers, sam, sam_headers, project = team(client)
    for i in range(3):
        create_task(client, ana_headers, project['id'], title=f'T{i}', assigned_to=sam['id'])
    first = inbox(client, sam_headers)['notifications'][0]

    response = client.put(f"/api/notifications/{first['id']}/read", headers=sam_headers)
    assert response.status_code == 200
    assert response.get_json()['notification']['read'] is True
    assert inbox(client, sam_headers)['unread_count'] == 2

    assert client.put('/api/notifications/read-all', headers=sam_headers).status_code == 200
    assert inbox(client, sam_headers)['unread_count'] == 0


def test_cannot_touch_someone_elses_notification(client):
    _, ana_headers, _, sam_headers, _ = team(client)
    ana_notification = inbox(client, ana_headers)['notifications'][0]
    assert client.put(f"/api/notifications/{ana_notification['id']}/read", headers=sam_headers).status_code == 404


def test_inbox_is_paginated(client):
    _, ana_headers, sam, sam_headers, project = team(client)
    for i in range(5):
        create_task(client, ana_headers, project['id'], title=f'T{i}', assigned_to=sam['id'])
    page = inbox(client, sam_headers, '?limit=3')
    assert len(page['notifications']) == 3
    rest = inbox(client, sam_headers, f"?limit=3&before={page['next_cursor']}")
    assert len(rest['notifications']) == 2
    assert rest['next_cursor'] is None


def test_inbox_requires_login(client):
    assert client.get('/api/notifications').status_code == 401
