from tests.conftest import create_project, create_task, get_json, join_project, register


def feed(client, headers, project_id, query=''):
    return get_json(client, f'/api/projects/{project_id}/activity{query}', headers)


def descriptions(client, headers, project_id):
    return [a['description'] for a in feed(client, headers, project_id)['activities']]


def test_creating_a_task_is_logged(client):
    _, headers = register(client)
    project = create_project(client, headers)
    create_task(client, headers, project['id'], title='Outline')
    activity = feed(client, headers, project['id'])['activities'][0]
    assert activity['action'] == 'task_created'
    assert activity['description'] == 'Ana Lee created "Outline"'
    assert activity['user']['first_name'] == 'Ana'
    assert activity['created_at'].endswith('Z')


def test_moving_and_assigning_are_logged(client):
    _, headers = register(client)
    sam, _ = register(client, email='sam@example.com', first_name='Sam', last_name='Kim')
    project = create_project(client, headers)
    join_project(project['id'], sam['id'])
    task = create_task(client, headers, project['id'], title='Outline')

    client.put(f"/api/tasks/{task['id']}/status", json={'status': 'review'}, headers=headers)
    client.put(f"/api/tasks/{task['id']}", json={'assigned_to': sam['id']}, headers=headers)

    assert descriptions(client, headers, project['id']) == [
        'Ana Lee assigned "Outline" to Sam Kim',
        'Ana Lee moved "Outline" to Review',
        'Ana Lee created "Outline"',
        'Sam Kim joined the project',
    ]


def test_unrelated_edits_are_not_logged(client):
    _, headers = register(client)
    project = create_project(client, headers)
    task = create_task(client, headers, project['id'])
    client.put(f"/api/tasks/{task['id']}", json={'title': 'Renamed', 'status': 'todo'}, headers=headers)
    assert len(feed(client, headers, project['id'])['activities']) == 1


def test_feed_is_newest_first_and_paginated(client):
    _, headers = register(client)
    project = create_project(client, headers)
    for i in range(5):
        create_task(client, headers, project['id'], title=f'T{i}')

    first = feed(client, headers, project['id'], '?limit=2')
    assert [a['description'] for a in first['activities']] == ['Ana Lee created "T4"', 'Ana Lee created "T3"']
    second = feed(client, headers, project['id'], f"?limit=2&before={first['next_cursor']}")
    assert [a['description'] for a in second['activities']] == ['Ana Lee created "T2"', 'Ana Lee created "T1"']
    last = feed(client, headers, project['id'], f"?limit=2&before={second['next_cursor']}")
    assert len(last['activities']) == 1
    assert last['next_cursor'] is None


def test_bad_pagination_values_are_rejected(client):
    _, headers = register(client)
    project = create_project(client, headers)
    response = client.get(f"/api/projects/{project['id']}/activity?limit=500", headers=headers)
    assert response.status_code == 400


def test_feed_is_members_only(client):
    _, headers = register(client)
    _, stranger = register(client, email='x@example.com')
    project = create_project(client, headers)
    assert client.get(f"/api/projects/{project['id']}/activity", headers=stranger).status_code == 403


def test_feed_query_count_is_flat(client, count_queries):
    _, headers = register(client)
    project = create_project(client, headers)
    create_task(client, headers, project['id'])
    with count_queries() as small:
        feed(client, headers, project['id'])
    for i in range(5):
        other, _ = register(client, email=f'm{i}@example.com')
        join_project(project['id'], other['id'])
    with count_queries() as big:
        feed(client, headers, project['id'])
    assert big.count == small.count
