from tests.conftest import create_project, get_json, join_project, register


def test_me_includes_private_settings(client):
    _, headers = register(client)
    me = get_json(client, '/api/auth/me', headers)['user']
    assert me['email_notifications'] is True
    assert me['timezone'] == 'UTC'


def test_teammates_do_not_see_private_settings(client):
    _, ana = register(client)
    sam, _ = register(client, email='sam@example.com')
    project = create_project(client, ana)
    join_project(project['id'], sam['id'])
    members = get_json(client, f"/api/projects/{project['id']}", ana)['project']['members']
    assert all('email_notifications' not in m['user'] and 'timezone' not in m['user'] for m in members)


def test_update_name_and_email_preference(client):
    _, headers = register(client)
    response = client.put('/api/users/me', json={'first_name': 'Annie', 'email_notifications': False}, headers=headers)
    assert response.status_code == 200
    user = response.get_json()['user']
    assert user['first_name'] == 'Annie' and user['last_name'] == 'Lee'
    assert user['full_name'] == 'Annie Lee'
    assert user['email_notifications'] is False


def test_name_cannot_be_blank_and_email_cannot_change_here(client):
    _, headers = register(client)
    assert client.put('/api/users/me', json={'first_name': ''}, headers=headers).status_code == 400
    response = client.put('/api/users/me', json={'email': 'new@example.com'}, headers=headers)
    assert response.status_code == 400


def change_password(client, headers, current, new):
    return client.put('/api/users/me/password', json={'current_password': current, 'new_password': new}, headers=headers)


def test_change_password(client):
    _, headers = register(client)
    assert change_password(client, headers, 'Passw0rdA', 'NewPassw0rd').status_code == 204
    old = client.post('/api/auth/login', json={'email': 'ana@example.com', 'password': 'Passw0rdA'})
    new = client.post('/api/auth/login', json={'email': 'ana@example.com', 'password': 'NewPassw0rd'})
    assert old.status_code == 401 and new.status_code == 200


def test_change_password_needs_the_current_one(client):
    _, headers = register(client)
    response = change_password(client, headers, 'WrongPass1', 'NewPassw0rd')
    assert response.status_code == 400
    assert 'current_password' in response.get_json()['error']['details']


def test_new_password_must_be_strong(client):
    _, headers = register(client)
    response = change_password(client, headers, 'Passw0rdA', 'weak')
    assert response.status_code == 400
    assert 'new_password' in response.get_json()['error']['details']
