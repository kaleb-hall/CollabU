from tests.conftest import create_project, create_task, get_json, join_project, register


def setup(client):
    ana, ana_headers = register(client)
    sam, sam_headers = register(client, email='sam@example.com', first_name='Sam', last_name='Kim')
    project = create_project(client, ana_headers)
    join_project(project['id'], sam['id'])
    task = create_task(client, ana_headers, project['id'], title='Outline')
    return ana_headers, sam_headers, project, task


def comment(client, headers, task_id, body):
    return client.post(f'/api/tasks/{task_id}/comments', json={'body': body}, headers=headers)


def test_comments_are_listed_oldest_first(client):
    ana, sam, _, task = setup(client)
    comment(client, ana, task['id'], 'First')
    comment(client, sam, task['id'], 'Second')
    comments = get_json(client, f"/api/tasks/{task['id']}/comments", ana)['comments']
    assert [c['body'] for c in comments] == ['First', 'Second']
    assert comments[1]['author']['first_name'] == 'Sam'
    assert comments[0]['created_at'].endswith('Z')


def test_comment_body_is_trimmed_and_required(client):
    ana, _, _, task = setup(client)
    assert comment(client, ana, task['id'], '   ').status_code == 400
    assert comment(client, ana, task['id'], 'x' * 2001).status_code == 400
    response = comment(client, ana, task['id'], '  Looks good  ')
    assert response.status_code == 201
    assert response.get_json()['comment']['body'] == 'Looks good'


def test_author_can_delete_their_comment(client):
    ana, _, _, task = setup(client)
    created = comment(client, ana, task['id'], 'Oops').get_json()['comment']
    assert client.delete(f"/api/tasks/{task['id']}/comments/{created['id']}", headers=ana).status_code == 204
    assert get_json(client, f"/api/tasks/{task['id']}/comments", ana)['comments'] == []


def test_others_cannot_delete_a_comment(client):
    ana, sam, _, task = setup(client)
    created = comment(client, ana, task['id'], 'Mine').get_json()['comment']
    assert client.delete(f"/api/tasks/{task['id']}/comments/{created['id']}", headers=sam).status_code == 403


def test_comment_must_belong_to_the_task_in_the_url(client):
    ana, _, project, task = setup(client)
    other_task = create_task(client, ana, project['id'], title='Other')
    created = comment(client, ana, task['id'], 'Hi').get_json()['comment']
    assert client.delete(f"/api/tasks/{other_task['id']}/comments/{created['id']}", headers=ana).status_code == 404


def test_non_members_cannot_read_or_write(client):
    _, _, _, task = setup(client)
    _, stranger = register(client, email='x@example.com')
    assert client.get(f"/api/tasks/{task['id']}/comments", headers=stranger).status_code == 403
    assert comment(client, stranger, task['id'], 'Hi').status_code == 403


def test_commenting_is_logged_in_activity(client):
    ana, sam, project, task = setup(client)
    comment(client, sam, task['id'], 'Hi')
    activity = get_json(client, f"/api/projects/{project['id']}/activity", ana)['activities'][0]
    assert activity['description'] == 'Sam Kim commented on "Outline"'


def test_deleting_a_task_deletes_its_comments(client):
    ana, _, _, task = setup(client)
    comment(client, ana, task['id'], 'Hi')
    assert client.delete(f"/api/tasks/{task['id']}", headers=ana).status_code == 204
    from app.models import Comment
    assert Comment.query.count() == 0
