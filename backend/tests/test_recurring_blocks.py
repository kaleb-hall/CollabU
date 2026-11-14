from tests.conftest import create_project, create_task, get_json, register

RANGE = '?start=2030-01-01T00:00:00Z&end=2030-02-01T00:00:00Z'


def create_block(client, headers, **overrides):
    payload = {
        'title': 'CS 101',
        'start_time': '2030-01-07T17:00:00Z',
        'end_time': '2030-01-07T18:30:00Z',
        'block_type': 'class',
        'repeat_days': ['MO', 'WE'],
        'repeat_until': '2030-01-16',
    }
    payload.update(overrides)
    return client.post('/api/calendar/blocks', json=payload, headers=headers)


def occurrences(client, headers, query=RANGE):
    return get_json(client, f'/api/calendar/blocks{query}', headers)['blocks']


def test_recurring_block_shows_every_occurrence_in_range(client):
    _, headers = register(client)
    created = create_block(client, headers)
    assert created.status_code == 201, created.get_json()
    series = created.get_json()['block']
    assert series['repeat_days'] == ['MO', 'WE'] and series['repeat_until'] == '2030-01-16'
    assert series['is_recurring'] is True

    listed = occurrences(client, headers)
    assert [o['start_time'] for o in listed] == [
        '2030-01-07T17:00:00Z', '2030-01-09T17:00:00Z', '2030-01-14T17:00:00Z', '2030-01-16T17:00:00Z',
    ]
    assert {o['id'] for o in listed} == {series['id']}
    assert listed[2]['series_start_time'] == '2030-01-07T17:00:00Z'


def test_range_is_required_and_checked(client):
    _, headers = register(client)
    assert client.get('/api/calendar/blocks', headers=headers).status_code == 400
    bad = '?start=2030-02-01T00:00:00Z&end=2030-01-01T00:00:00Z'
    assert client.get(f'/api/calendar/blocks{bad}', headers=headers).status_code == 400


def test_repeat_fields_must_come_together_and_make_sense(client):
    _, headers = register(client)
    assert create_block(client, headers, repeat_until=None).status_code == 400
    assert create_block(client, headers, repeat_days=[]).status_code == 400
    assert create_block(client, headers, repeat_days=['XX']).status_code == 400
    assert create_block(client, headers, repeat_until='2029-12-01').status_code == 400


def test_one_off_blocks_still_work(client):
    _, headers = register(client)
    created = create_block(client, headers, repeat_days=None, repeat_until=None).get_json()['block']
    assert created['is_recurring'] is False
    assert len(occurrences(client, headers)) == 1


def test_editing_changes_the_whole_series(client):
    _, headers = register(client)
    series = create_block(client, headers).get_json()['block']
    response = client.put(f"/api/calendar/blocks/{series['id']}", json={'repeat_days': ['FR'], 'title': 'CS 102'}, headers=headers)
    assert response.status_code == 200
    listed = occurrences(client, headers)
    assert [o['start_time'][:10] for o in listed] == ['2030-01-11']
    assert listed[0]['title'] == 'CS 102'


def test_turning_repeat_off(client):
    _, headers = register(client)
    series = create_block(client, headers).get_json()['block']
    client.put(f"/api/calendar/blocks/{series['id']}", json={'repeat_days': None, 'repeat_until': None}, headers=headers)
    assert len(occurrences(client, headers)) == 1


def test_deleting_removes_the_whole_series(client):
    _, headers = register(client)
    series = create_block(client, headers).get_json()['block']
    assert client.delete(f"/api/calendar/blocks/{series['id']}", headers=headers).status_code == 204
    assert occurrences(client, headers) == []


def test_overlap_warning_includes_repeats(client):
    _, headers = register(client)
    create_block(client, headers)
    # A one-off on the second Wednesday collides with the repeating class
    response = create_block(client, headers, title='Dentist', start_time='2030-01-16T17:30:00Z',
                            end_time='2030-01-16T18:00:00Z', repeat_days=None, repeat_until=None)
    assert response.get_json()['warnings'] == ['Overlaps with "CS 101"']


def test_scheduler_works_around_a_repeating_class(client):
    ana, headers = register(client)
    project = create_project(client, headers, deadline='2030-01-15T12:00:00Z')
    create_task(client, headers, project['id'], estimated_hours=2)
    # Busy 00:00 to 23:59 UTC every day until Jan 14: the only free time is after that
    create_block(client, headers, start_time='2020-01-06T00:00:00Z', end_time='2020-01-06T23:59:00Z',
                 repeat_days=['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'], repeat_until='2030-01-13')
    response = client.post(f"/api/projects/{project['id']}/schedule", json={'timezone': 'UTC'}, headers=headers)
    assert response.get_json()['schedule']['tasks'][0]['start_date'] >= '2030-01-14'
