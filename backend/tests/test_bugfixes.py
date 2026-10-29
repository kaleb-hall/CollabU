"""Regression tests for bugs found in the phase 1 audit (see PLAN.md section 0)."""
from tests.conftest import register, create_project, create_task, join_project
from tests.test_calendar import make_block


def add_member(client, owner_headers, project_id, user_id):
    join_project(project_id, user_id)


def test_template_project_accepts_utc_deadline(client):
    _, headers = register(client)
    response = client.post('/api/projects', json={
        'title': 'Research paper', 'deadline': '2030-01-15T12:00:00Z', 'auto_generate_tasks': True,
    }, headers=headers)
    assert response.status_code == 201
    assert response.get_json()['suggestions']['tasks_created'] > 0


def test_task_suggestions_endpoint_returns_iso_dates(client):
    _, headers = register(client)
    project = create_project(client, headers, title='Research paper')
    response = client.get(f"/api/projects/{project['id']}/task-suggestions", headers=headers)
    assert response.status_code == 200
    assert response.get_json()['tasks'][0]['due_date'].endswith('Z')


def test_schedule_route_used_by_frontend_exists(client):
    _, headers = register(client)
    project = create_project(client, headers)
    create_task(client, headers, project['id'])
    response = client.post(f"/api/projects/{project['id']}/schedule", headers=headers)
    assert response.status_code == 200
    assert 'schedule' in response.get_json()


def test_overlapping_block_is_saved_with_warning(client):
    _, headers = register(client)
    make_block(client, headers)
    response = make_block(client, headers, title='Lab', start_time='2030-01-07T18:00:00', end_time='2030-01-07T19:00:00')
    assert response.status_code == 201
    body = response.get_json()
    assert body['block']['title'] == 'Lab'
    assert body['warnings']
    assert len(client.get('/api/calendar/blocks', headers=headers).get_json()['blocks']) == 2


def test_my_tasks_only_returns_tasks_assigned_to_me(client):
    ana, ana_headers = register(client)
    sam, _ = register(client, email='sam@example.com')
    project = create_project(client, ana_headers)
    add_member(client, ana_headers, project['id'], sam['id'])
    mine = create_task(client, ana_headers, project['id'], title='Mine', assigned_to=ana['id'])
    create_task(client, ana_headers, project['id'], title='Sams', assigned_to=sam['id'])
    create_task(client, ana_headers, project['id'], title='Nobody')

    tasks = client.get('/api/tasks/my-tasks', headers=ana_headers).get_json()['tasks']
    assert [t['id'] for t in tasks] == [mine['id']]
    assert tasks[0]['project']['title'] == project['title']


def test_cannot_assign_task_to_non_member(client):
    _, ana_headers = register(client)
    stranger, _ = register(client, email='sam@example.com')
    project = create_project(client, ana_headers)
    response = client.post(f"/api/tasks/project/{project['id']}", json={
        'title': 'x', 'due_date': '2030-01-01T00:00:00', 'assigned_to': stranger['id'],
    }, headers=ana_headers)
    assert response.status_code == 400
    task = create_task(client, ana_headers, project['id'])
    response = client.put(f"/api/tasks/{task['id']}", json={'assigned_to': stranger['id']}, headers=ana_headers)
    assert response.status_code == 400


def test_times_are_returned_as_utc_with_z(client):
    _, headers = register(client)
    project = create_project(client, headers, deadline='2030-01-15T12:00:00+02:00')
    assert project['deadline'] == '2030-01-15T10:00:00Z'
    task = create_task(client, headers, project['id'], due_date='2030-01-10T09:30:00-08:00')
    assert task['due_date'] == '2030-01-10T17:30:00Z'
    block = make_block(client, headers, start_time='2030-01-07T09:00:00-08:00', end_time='2030-01-07T10:00:00-08:00')
    assert block.get_json()['block']['start_time'] == '2030-01-07T17:00:00Z'


def test_project_member_pair_is_unique_in_database(app):
    import pytest
    from sqlalchemy.exc import IntegrityError
    from app import db
    from app.models import Project, ProjectMember, User
    from datetime import datetime

    user = User(email='a@b.c', first_name='A', last_name='B')
    user.set_password('x')
    db.session.add(user)
    db.session.flush()
    project = Project(title='P', deadline=datetime(2030, 1, 1), created_by=user.id)
    db.session.add(project)
    db.session.flush()
    db.session.add(ProjectMember(project_id=project.id, user_id=user.id))
    db.session.add(ProjectMember(project_id=project.id, user_id=user.id))
    with pytest.raises(IntegrityError):
        db.session.flush()


def test_template_keywords_match_whole_words_and_prefer_specific(app):
    from app.services.task_templates import detect_template
    assert detect_template('Approval form') == 'generic'
    assert detect_template('Chem lab report') == 'lab_experiment'
    assert detect_template('History essay') == 'research_paper'


def test_chosen_template_is_used_over_title_guess(client):
    _, headers = register(client)
    response = client.post('/api/projects', json={
        'title': 'Chem stuff', 'deadline': '2030-01-15T12:00:00Z',
        'auto_generate_tasks': True, 'template': 'lab_experiment',
    }, headers=headers)
    assert response.get_json()['suggestions']['project_type'] == 'lab_experiment'


def test_completed_at_follows_status(client):
    _, headers = register(client)
    project = create_project(client, headers)
    task = create_task(client, headers, project['id'])
    done = client.put(f"/api/tasks/{task['id']}/status", json={'status': 'completed'}, headers=headers).get_json()['task']
    assert done['completed_at'] is not None
    reopened = client.put(f"/api/tasks/{task['id']}/status", json={'status': 'todo'}, headers=headers).get_json()['task']
    assert reopened['completed_at'] is None
