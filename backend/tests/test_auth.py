from tests.conftest import register


def test_register_returns_user_and_token(client):
    user, headers = register(client)
    assert user['email'] == 'ana@example.com'
    assert headers['Authorization'].startswith('Bearer ')


def test_register_rejects_duplicate_email(client):
    register(client)
    response = client.post('/api/auth/register', json={
        'email': 'ana@example.com', 'password': 'Passw0rdA', 'first_name': 'A', 'last_name': 'B',
    })
    assert response.status_code in (400, 409)


def test_register_rejects_weak_password(client):
    response = client.post('/api/auth/register', json={
        'email': 'b@example.com', 'password': 'weakpass', 'first_name': 'A', 'last_name': 'B',
    })
    assert response.status_code == 400


def test_login_with_correct_password(client):
    register(client)
    response = client.post('/api/auth/login', json={'email': 'ana@example.com', 'password': 'Passw0rdA'})
    assert response.status_code == 200
    assert 'access_token' in response.get_json()


def test_login_with_wrong_password(client):
    register(client)
    response = client.post('/api/auth/login', json={'email': 'ana@example.com', 'password': 'Wrong1234'})
    assert response.status_code == 401


def test_me_requires_token(client):
    assert client.get('/api/auth/me').status_code == 401


def test_me_returns_current_user(client):
    _, headers = register(client)
    response = client.get('/api/auth/me', headers=headers)
    assert response.status_code == 200
    assert response.get_json()['user']['email'] == 'ana@example.com'
