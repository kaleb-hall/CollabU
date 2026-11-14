from datetime import datetime

import pytest

from app.services import workload_service
from tests.conftest import create_project, create_task, get_json, join_project, register

WEDNESDAY_NOON = datetime(2030, 1, 9, 12)  # week is Mon Jan 7 to Mon Jan 14 (UTC users)


@pytest.fixture
def team(client, monkeypatch):
    monkeypatch.setattr(workload_service, 'utcnow', lambda: WEDNESDAY_NOON)
    _, ana = register(client)
    sam, sam_headers = register(client, email='sam@example.com', first_name='Sam', last_name='Kim')
    lee, _ = register(client, email='lee@example.com', first_name='Lee', last_name='Park')
    project = create_project(client, ana, deadline='2030-03-01T00:00:00Z')
    join_project(project['id'], sam['id'])
    join_project(project['id'], lee['id'])
    return ana, project, sam, sam_headers, lee


def workload(client, headers, project_id):
    body = get_json(client, f'/api/projects/{project_id}/workload', headers)
    return body, {m['name']: m for m in body['members']}


def test_week_runs_monday_to_monday(client, team):
    ana, project, *_ = team
    body, _ = workload(client, ana, project['id'])
    assert body['week_start'] == '2030-01-07T00:00:00Z'
    assert body['week_end'] == '2030-01-14T00:00:00Z'


def test_counts_open_tasks_due_this_week(client, team):
    ana, project, sam, _, lee = team
    create_task(client, ana, project['id'], assigned_to=sam['id'], estimated_hours=10, due_date='2030-01-11T12:00:00Z')
    create_task(client, ana, project['id'], assigned_to=sam['id'], due_date='2030-01-08T12:00:00Z')  # no estimate: 4h
    create_task(client, ana, project['id'], assigned_to=sam['id'], estimated_hours=9, due_date='2030-01-15T12:00:00Z')
    done = create_task(client, ana, project['id'], assigned_to=sam['id'], estimated_hours=9, due_date='2030-01-10T12:00:00Z')
    client.put(f"/api/tasks/{done['id']}/status", json={'status': 'completed'}, headers=ana)

    _, members = workload(client, ana, project['id'])
    assert members['Sam Kim']['assigned_hours'] == 14
    assert members['Sam Kim']['task_count'] == 2
    assert members['Lee Park']['assigned_hours'] == 0


def test_free_hours_are_what_is_left_of_the_week(client, team):
    ana, project, _, sam_headers, _ = team
    # Wednesday 12:00 to 17:00 is 5 hours, Thursday to Sunday is 4 x 8 = 32 hours
    _, members = workload(client, ana, project['id'])
    assert members['Lee Park']['free_hours'] == 37

    client.post('/api/calendar/blocks', json={
        'title': 'Lab', 'start_time': '2030-01-10T09:00:00Z', 'end_time': '2030-01-10T12:00:00Z',
    }, headers=sam_headers)
    _, members = workload(client, ana, project['id'])
    assert members['Sam Kim']['free_hours'] == 34


def test_flags_people_with_more_work_than_time(client, team):
    ana, project, sam, _, lee = team
    create_task(client, ana, project['id'], assigned_to=lee['id'], estimated_hours=40, due_date='2030-01-10T12:00:00Z')
    create_task(client, ana, project['id'], assigned_to=sam['id'], estimated_hours=30, due_date='2030-01-10T12:00:00Z')
    _, members = workload(client, ana, project['id'])
    assert members['Lee Park']['overloaded'] is True
    assert members['Sam Kim']['overloaded'] is False


def test_members_only(client, team):
    _, project, *_ = team
    _, stranger = register(client, email='x@example.com')
    assert client.get(f"/api/projects/{project['id']}/workload", headers=stranger).status_code == 403
