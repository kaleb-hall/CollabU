import pytest

from app import create_app
from tests.conftest import register, create_project


def assert_error(response, status, code):
    assert response.status_code == status
    body = response.get_json()
    assert body['error']['code'] == code
    assert isinstance(body['error']['message'], str) and body['error']['message']


def test_not_found_uses_error_format(client):
    _, headers = register(client)
    assert_error(client.get('/api/projects/999', headers=headers), 404, 'NOT_FOUND')


def test_forbidden_uses_error_format(client):
    _, owner = register(client)
    _, stranger = register(client, email='sam@example.com')
    project = create_project(client, owner)
    assert_error(client.get(f"/api/projects/{project['id']}", headers=stranger), 403, 'FORBIDDEN')


def test_validation_error_lists_fields(client):
    response = client.post('/api/auth/register', json={'email': 'not-an-email'})
    assert_error(response, 400, 'VALIDATION_ERROR')
    details = response.get_json()['error']['details']
    assert 'email' in details and 'password' in details


def test_missing_token_is_unauthorized(client):
    assert_error(client.get('/api/projects'), 401, 'UNAUTHORIZED')


def test_garbage_token_is_unauthorized(client):
    response = client.get('/api/projects', headers={'Authorization': 'Bearer nope'})
    assert_error(response, 401, 'UNAUTHORIZED')


def test_unknown_url_uses_error_format(client):
    assert_error(client.get('/api/does-not-exist'), 404, 'NOT_FOUND')


def test_wrong_method_uses_error_format(client):
    assert_error(client.patch('/api/auth/login'), 405, 'METHOD_NOT_ALLOWED')


def test_missing_body_is_validation_error(client):
    response = client.post('/api/auth/login', data='not json', content_type='text/plain')
    assert_error(response, 400, 'VALIDATION_ERROR')


def test_conflict_uses_error_format(client):
    register(client)
    response = client.post('/api/auth/register', json={
        'email': 'ana@example.com', 'password': 'Passw0rdA', 'first_name': 'A', 'last_name': 'B',
    })
    assert_error(response, 409, 'CONFLICT')


def test_unexpected_error_hides_details(app, client):
    @app.route('/api/boom')
    def boom():
        raise RuntimeError('secret internals')

    app.config['PROPAGATE_EXCEPTIONS'] = False
    response = client.get('/api/boom')
    assert_error(response, 500, 'INTERNAL_ERROR')
    assert 'secret internals' not in response.get_data(as_text=True)


def test_production_requires_secrets(monkeypatch):
    for key in ['SECRET_KEY', 'JWT_SECRET_KEY', 'DATABASE_URL', 'FRONTEND_URL']:
        monkeypatch.delenv(key, raising=False)
    with pytest.raises(RuntimeError, match='SECRET_KEY'):
        create_app('production')
