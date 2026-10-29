from tests.conftest import register, create_project, create_task


def test_create_list_update_delete_task(client):
    _, headers = register(client)
    project = create_project(client, headers)
    task = create_task(client, headers, project['id'], estimated_hours=3, priority='high')

    tasks = client.get(f"/api/tasks/project/{project['id']}", headers=headers).get_json()['tasks']
    assert [t['id'] for t in tasks] == [task['id']]

    response = client.put(f"/api/tasks/{task['id']}", json={'title': 'Full outline'}, headers=headers)
    assert response.status_code == 200
    assert response.get_json()['task']['title'] == 'Full outline'

    assert client.get(f"/api/tasks/{task['id']}", headers=headers).status_code == 200
    assert client.delete(f"/api/tasks/{task['id']}", headers=headers).status_code == 200
    assert client.get(f"/api/tasks/{task['id']}", headers=headers).status_code == 404


def test_status_update_accepts_every_status(client):
    _, headers = register(client)
    project = create_project(client, headers)
    task = create_task(client, headers, project['id'])
    for status in ['in_progress', 'review', 'blocked', 'completed', 'todo']:
        response = client.put(f"/api/tasks/{task['id']}/status", json={'status': status}, headers=headers)
        assert response.status_code == 200
        assert response.get_json()['task']['status'] == status


def test_status_update_rejects_unknown_status(client):
    _, headers = register(client)
    project = create_project(client, headers)
    task = create_task(client, headers, project['id'])
    response = client.put(f"/api/tasks/{task['id']}/status", json={'status': 'done-ish'}, headers=headers)
    assert response.status_code == 400


def test_non_member_cannot_touch_tasks(client):
    _, owner = register(client)
    _, stranger = register(client, email='sam@example.com')
    project = create_project(client, owner)
    task = create_task(client, owner, project['id'])
    assert client.get(f"/api/tasks/project/{project['id']}", headers=stranger).status_code == 403
    assert client.get(f"/api/tasks/{task['id']}", headers=stranger).status_code == 403
    assert client.put(f"/api/tasks/{task['id']}", json={'title': 'x'}, headers=stranger).status_code == 403
    assert client.delete(f"/api/tasks/{task['id']}", headers=stranger).status_code == 403
    response = client.post(f"/api/tasks/project/{project['id']}", json={'title': 'x', 'due_date': '2030-01-01T00:00:00'}, headers=stranger)
    assert response.status_code == 403
