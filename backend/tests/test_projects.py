from tests.conftest import register, create_project


def test_create_and_list_projects(client):
    _, headers = register(client)
    project = create_project(client, headers)
    response = client.get('/api/projects', headers=headers)
    assert response.status_code == 200
    assert [p['id'] for p in response.get_json()['projects']] == [project['id']]


def test_template_project_creates_suggested_tasks(client):
    _, headers = register(client)
    project = create_project(client, headers, title='Research paper', auto_generate_tasks=True)
    tasks = client.get(f"/api/tasks/project/{project['id']}", headers=headers).get_json()['tasks']
    assert len(tasks) > 0


def test_project_rejects_past_deadline(client):
    _, headers = register(client)
    response = client.post('/api/projects', json={'title': 'X', 'deadline': '2000-01-01T00:00:00'}, headers=headers)
    assert response.status_code == 400


def test_non_member_cannot_view_project(client):
    _, owner = register(client)
    _, stranger = register(client, email='sam@example.com')
    project = create_project(client, owner)
    assert client.get(f"/api/projects/{project['id']}", headers=stranger).status_code == 403


def test_missing_project_is_404(client):
    _, headers = register(client)
    assert client.get('/api/projects/999', headers=headers).status_code == 404


def test_admin_can_update_and_delete(client):
    _, headers = register(client)
    project = create_project(client, headers)
    response = client.put(f"/api/projects/{project['id']}", json={'title': 'Renamed'}, headers=headers)
    assert response.status_code == 200
    assert response.get_json()['project']['title'] == 'Renamed'
    assert client.delete(f"/api/projects/{project['id']}", headers=headers).status_code == 204
    assert client.get(f"/api/projects/{project['id']}", headers=headers).status_code == 404


def test_add_and_remove_member(client):
    _, owner = register(client)
    sam, sam_headers = register(client, email='sam@example.com', first_name='Sam')
    project = create_project(client, owner)

    response = client.post(f"/api/projects/{project['id']}/members", json={'user_id': sam['id']}, headers=owner)
    assert response.status_code == 201
    member_id = response.get_json()['member']['id']
    assert client.get(f"/api/projects/{project['id']}", headers=sam_headers).status_code == 200

    again = client.post(f"/api/projects/{project['id']}/members", json={'user_id': sam['id']}, headers=owner)
    assert again.status_code == 409

    assert client.delete(f"/api/projects/{project['id']}/members/{member_id}", headers=owner).status_code == 204
    assert client.get(f"/api/projects/{project['id']}", headers=sam_headers).status_code == 403


def test_regular_member_cannot_update_project(client):
    _, owner = register(client)
    sam, sam_headers = register(client, email='sam@example.com')
    project = create_project(client, owner)
    client.post(f"/api/projects/{project['id']}/members", json={'user_id': sam['id']}, headers=owner)
    response = client.put(f"/api/projects/{project['id']}", json={'title': 'Mine'}, headers=sam_headers)
    assert response.status_code == 403
