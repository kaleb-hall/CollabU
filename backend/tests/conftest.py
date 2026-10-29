import os



import pytest

from app import create_app, db


@pytest.fixture
def app():
    app = create_app('testing')
    app.config['TESTING'] = True
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def register(client, email='ana@example.com', first_name='Ana', last_name='Lee', password='Passw0rdA'):
    response = client.post('/api/auth/register', json={
        'email': email,
        'password': password,
        'first_name': first_name,
        'last_name': last_name,
    })
    assert response.status_code == 201, response.get_json()
    body = response.get_json()
    return body['user'], {'Authorization': f"Bearer {body['access_token']}"}


def create_project(client, headers, **overrides):
    payload = {
        'title': 'Group essay',
        'description': 'History essay',
        'deadline': '2030-01-15T12:00:00',
    }
    payload.update(overrides)
    response = client.post('/api/projects', json=payload, headers=headers)
    assert response.status_code == 201, response.get_json()
    return response.get_json()['project']


def create_task(client, headers, project_id, **overrides):
    payload = {'title': 'Outline', 'due_date': '2030-01-10T12:00:00'}
    payload.update(overrides)
    response = client.post(f'/api/tasks/project/{project_id}', json=payload, headers=headers)
    assert response.status_code == 201, response.get_json()
    return response.get_json()['task']


class QueryCounter:
    def __init__(self, engine):
        self.engine = engine
        self.count = 0

    def __enter__(self):
        from sqlalchemy import event
        event.listen(self.engine, 'before_cursor_execute', self.increment)
        return self

    def __exit__(self, *exc):
        from sqlalchemy import event
        event.remove(self.engine, 'before_cursor_execute', self.increment)

    def increment(self, *args):
        self.count += 1


@pytest.fixture
def count_queries(app):
    def counter():
        return QueryCounter(db.engine)
    return counter
