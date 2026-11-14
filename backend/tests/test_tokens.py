"""Short access tokens, a longer refresh token, and a refresh endpoint."""
from datetime import timedelta

from flask_jwt_extended import create_access_token, create_refresh_token

from tests.conftest import register


def login(client):
    register(client)
    response = client.post('/api/auth/login', json={'email': 'ana@example.com', 'password': 'Passw0rdA'})
    assert response.status_code == 200
    return response.get_json()


def bearer(token):
    return {'Authorization': f'Bearer {token}'}


def test_login_and_register_return_both_tokens(client):
    body = login(client)
    assert body['access_token'] and body['refresh_token']
    assert body['access_token'] != body['refresh_token']


def test_refresh_gives_a_working_access_token(client):
    body = login(client)

    response = client.post('/api/auth/refresh', headers=bearer(body['refresh_token']))

    assert response.status_code == 200
    fresh = response.get_json()['access_token']
    assert client.get('/api/auth/me', headers=bearer(fresh)).status_code == 200


def test_refresh_token_cannot_be_used_as_an_access_token(client):
    body = login(client)
    assert client.get('/api/auth/me', headers=bearer(body['refresh_token'])).status_code == 401


def test_access_token_cannot_refresh(client):
    body = login(client)
    assert client.post('/api/auth/refresh', headers=bearer(body['access_token'])).status_code == 401


def test_expired_access_token_says_so(app, client):
    user = login(client)['user']
    expired = create_access_token(identity=str(user['id']), expires_delta=timedelta(seconds=-1))

    response = client.get('/api/auth/me', headers=bearer(expired))

    assert response.status_code == 401
    assert response.get_json()['error']['code'] == 'TOKEN_EXPIRED'


def test_expired_refresh_token_means_logging_in_again(app, client):
    user = login(client)['user']
    expired = create_refresh_token(identity=str(user['id']), expires_delta=timedelta(seconds=-1))

    assert client.post('/api/auth/refresh', headers=bearer(expired)).status_code == 401


def test_refresh_for_a_deleted_user_fails(app, client):
    expired_user_token = create_refresh_token(identity='999')
    assert client.post('/api/auth/refresh', headers=bearer(expired_user_token)).status_code == 401


def test_token_lifetimes_come_from_config(app):
    assert app.config['JWT_ACCESS_TOKEN_EXPIRES'] == timedelta(minutes=15)
    assert app.config['JWT_REFRESH_TOKEN_EXPIRES'] == timedelta(days=30)
