from tests.conftest import register, create_project, create_task, join_project


def setup_team(client):
    ana, headers = register(client)
    sam, _ = register(client, email='sam@example.com', first_name='Sam')
    project = create_project(client, headers, deadline='2030-01-15T12:00:00Z')
    join_project(project['id'], sam['id'])
    return ana, sam, headers, project


def schedule(client, headers, project_id, timezone='UTC'):
    response = client.post(f'/api/projects/{project_id}/schedule', json={'timezone': timezone}, headers=headers)
    assert response.status_code == 200, response.get_json()
    return response.get_json()


def test_schedule_assigns_and_dates_open_tasks(client):
    _, _, headers, project = setup_team(client)
    for i in range(4):
        create_task(client, headers, project['id'], title=f'T{i}', estimated_hours=4)
    body = schedule(client, headers, project['id'])
    tasks = client.get(f"/api/tasks/project/{project['id']}", headers=headers).get_json()['tasks']
    assert all(t['assigned_to'] for t in tasks)
    assert all(t['start_date'] for t in tasks)
    assert len({t['assigned_to'] for t in tasks}) == 2
    assert body['schedule']['is_achievable']


def test_completed_tasks_are_not_touched(client):
    _, _, headers, project = setup_team(client)
    done = create_task(client, headers, project['id'], due_date='2030-01-02T10:00:00Z')
    client.put(f"/api/tasks/{done['id']}/status", json={'status': 'completed'}, headers=headers)
    schedule(client, headers, project['id'])
    after = client.get(f"/api/tasks/{done['id']}", headers=headers).get_json()['task']
    assert after['due_date'] == '2030-01-02T10:00:00Z'
    assert after['assigned_to'] is None


def test_manual_assignee_is_kept(client):
    _, sam, headers, project = setup_team(client)
    for i in range(3):
        create_task(client, headers, project['id'], assigned_to=sam['id'], estimated_hours=2)
    schedule(client, headers, project['id'])
    tasks = client.get(f"/api/tasks/project/{project['id']}", headers=headers).get_json()['tasks']
    assert {t['assigned_to'] for t in tasks} == {sam['id']}


def test_calendar_blocks_push_work_later(client):
    ana, _, headers, project = setup_team(client)
    # Only Ana is in the project for this test
    solo = create_project(client, headers, deadline='2030-01-15T12:00:00Z')
    create_task(client, headers, solo['id'], estimated_hours=2)
    client.post('/api/calendar/blocks', json={
        'title': 'All day class', 'start_time': '2020-01-01T00:00:00Z', 'end_time': '2030-01-14T00:00:00Z',
    }, headers=headers)
    body = schedule(client, headers, solo['id'])
    assert body['schedule']['tasks'][0]['start_date'] >= '2030-01-14'


def test_schedule_returns_plain_warnings_list(client):
    _, _, headers, project = setup_team(client)
    body = schedule(client, headers, project['id'])
    assert body['warnings'] == ['There are no open tasks to schedule']


def test_unknown_timezone_is_validation_error(client):
    _, _, headers, project = setup_team(client)
    response = client.post(f"/api/projects/{project['id']}/schedule", json={'timezone': 'Mars/Base'}, headers=headers)
    assert response.status_code == 400


def test_schedule_query_count_does_not_grow_with_tasks(client, count_queries):
    _, _, headers, project = setup_team(client)
    create_task(client, headers, project['id'])
    with count_queries() as small:
        schedule(client, headers, project['id'])
    for i in range(10):
        create_task(client, headers, project['id'], title=f'More {i}')
    with count_queries() as big:
        schedule(client, headers, project['id'])
    assert big.count <= small.count + 1  # one bulk UPDATE statement may be batched differently
