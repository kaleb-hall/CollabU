"""Production settings: required secrets, CORS, security headers and login rate limits."""
import pytest

from app import create_app, db

PRODUCTION_ENV = {
    'SECRET_KEY': 'x' * 40,
    'JWT_SECRET_KEY': 'y' * 40,
    'DATABASE_URL': 'sqlite:///:memory:',
    'FRONTEND_URL': 'https://collabu.vercel.app',
    'EMAIL_BACKEND': 'console',
    'STORAGE_BACKEND': 'local',
}


@pytest.fixture
def production_env(monkeypatch, tmp_path):
    for key, value in PRODUCTION_ENV.items():
        monkeypatch.setenv(key, value)
    monkeypatch.setenv('UPLOAD_FOLDER', str(tmp_path))
    monkeypatch.setenv('CORS_ORIGINS', 'http://localhost:5173')
    return monkeypatch


def test_production_needs_the_frontend_url(production_env):
    production_env.delenv('FRONTEND_URL')
    with pytest.raises(RuntimeError, match='FRONTEND_URL'):
        create_app('production')


def test_production_needs_resend_settings_to_send_email(production_env):
    production_env.setenv('EMAIL_BACKEND', 'resend')
    with pytest.raises(RuntimeError, match='RESEND_API_KEY'):
        create_app('production')


def test_production_needs_bucket_settings_for_s3(production_env):
    production_env.setenv('STORAGE_BACKEND', 's3')
    with pytest.raises(RuntimeError, match='S3_BUCKET'):
        create_app('production')


def test_production_only_allows_the_real_frontend(production_env):
    app = create_app('production')
    client = app.test_client()

    allowed = client.options('/api/auth/login', headers={
        'Origin': 'https://collabu.vercel.app', 'Access-Control-Request-Method': 'POST'})
    other = client.options('/api/auth/login', headers={
        'Origin': 'http://localhost:5173', 'Access-Control-Request-Method': 'POST'})

    assert allowed.headers.get('Access-Control-Allow-Origin') == 'https://collabu.vercel.app'
    assert 'Access-Control-Allow-Origin' not in other.headers


def test_security_headers(production_env):
    response = create_app('production').test_client().get('/api/health')

    assert response.status_code == 200
    assert response.headers['X-Content-Type-Options'] == 'nosniff'
    assert response.headers['X-Frame-Options'] == 'DENY'
    assert response.headers['Referrer-Policy'] == 'no-referrer'
    assert "frame-ancestors 'none'" in response.headers['Content-Security-Policy']
    assert 'max-age=' in response.headers['Strict-Transport-Security']


def test_no_hsts_in_development(app, client):
    response = client.get('/api/health')
    assert 'Strict-Transport-Security' not in response.headers
    assert response.headers['X-Content-Type-Options'] == 'nosniff'


def test_login_is_rate_limited(monkeypatch):
    monkeypatch.setenv('RATELIMIT_ENABLED', 'true')
    app = create_app('testing')
    with app.app_context():
        db.create_all()
    client = app.test_client()
    body = {'email': 'nobody@example.com', 'password': 'wrong'}

    statuses = [client.post('/api/auth/login', json=body).status_code for _ in range(11)]

    assert statuses[:10] == [401] * 10
    assert statuses[10] == 429
    error = client.post('/api/auth/login', json=body).get_json()['error']
    assert error['code'] == 'RATE_LIMITED'


def test_register_is_rate_limited(monkeypatch):
    monkeypatch.setenv('RATELIMIT_ENABLED', 'true')
    client = create_app('testing').test_client()

    statuses = [client.post('/api/auth/register', json={}).status_code for _ in range(6)]

    assert statuses[-1] == 429
