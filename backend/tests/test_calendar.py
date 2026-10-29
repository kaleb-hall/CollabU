from tests.conftest import register


def make_block(client, headers, **overrides):
    payload = {
        'title': 'CS 101',
        'start_time': '2030-01-07T17:00:00',
        'end_time': '2030-01-07T18:30:00',
        'block_type': 'class',
    }
    payload.update(overrides)
    return client.post('/api/calendar/blocks', json=payload, headers=headers)


def test_create_list_update_delete_block(client):
    _, headers = register(client)
    response = make_block(client, headers)
    assert response.status_code == 201
    block_id = response.get_json()['block']['id']

    blocks = client.get('/api/calendar/blocks', headers=headers).get_json()['blocks']
    assert [b['id'] for b in blocks] == [block_id]

    response = client.put(f'/api/calendar/blocks/{block_id}', json={'title': 'CS 102'}, headers=headers)
    assert response.status_code == 200
    assert response.get_json()['block']['title'] == 'CS 102'

    assert client.delete(f'/api/calendar/blocks/{block_id}', headers=headers).status_code == 204
    assert client.get('/api/calendar/blocks', headers=headers).get_json()['blocks'] == []


def test_block_end_must_be_after_start(client):
    _, headers = register(client)
    response = make_block(client, headers, end_time='2030-01-07T16:00:00')
    assert response.status_code == 400


def test_cannot_see_other_users_blocks(client):
    _, ana = register(client)
    _, sam = register(client, email='sam@example.com')
    block_id = make_block(client, ana).get_json()['block']['id']
    assert client.get('/api/calendar/blocks', headers=sam).get_json()['blocks'] == []
    assert client.get(f'/api/calendar/blocks/{block_id}', headers=sam).status_code == 404
    assert client.delete(f'/api/calendar/blocks/{block_id}', headers=sam).status_code == 404
