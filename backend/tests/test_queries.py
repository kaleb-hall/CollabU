"""Make sure list endpoints do not run one query per row (the N+1 problem)."""
from tests.conftest import register, create_project, create_task, join_project


def add_member(client, owner_headers, project_id, user_id):
    join_project(project_id, user_id)


def build_projects(client, how_many):
    ana, headers = register(client)
    teammates = [register(client, email=f'mate{i}@example.com')[0] for i in range(3)]
    for p in range(how_many):
        project = create_project(client, headers, title=f'Project {p}')
        for mate in teammates:
            add_member(client, headers, project['id'], mate['id'])
        for t, mate in enumerate(teammates):
            create_task(client, headers, project['id'], title=f'Task {t}', assigned_to=mate['id'])
        create_task(client, headers, project['id'], title='Mine', assigned_to=ana['id'])
    return headers


def queries_for(client, count_queries, url, headers):
    with count_queries() as counter:
        response = client.get(url, headers=headers)
    assert response.status_code == 200
    return counter.count



def test_project_list_does_not_grow_with_projects(client, count_queries):
    headers = build_projects(client, 1)
    one = queries_for(client, count_queries, '/api/projects', headers)
    for p in range(4):
        project = create_project(client, headers, title=f'Extra {p}')
        create_task(client, headers, project['id'])
    five = queries_for(client, count_queries, '/api/projects', headers)
    assert five == one
    assert one <= 6


def test_project_list_includes_task_summary(client):
    headers = build_projects(client, 1)
    project = client.get('/api/projects', headers=headers).get_json()['projects'][0]
    assert project['task_counts'] == {'todo': 4, 'in_progress': 0, 'review': 0, 'blocked': 0, 'completed': 0, 'total': 4}
    assert project['next_task']['title']
    assert len(project['members']) == 4


def test_project_detail_does_not_grow_with_members(client, count_queries):
    headers = build_projects(client, 1)
    project_id = client.get('/api/projects', headers=headers).get_json()['projects'][0]['id']
    assert queries_for(client, count_queries, f'/api/projects/{project_id}', headers) <= 6


def test_project_tasks_do_not_grow_with_tasks(client, count_queries):
    headers = build_projects(client, 1)
    project_id = client.get('/api/projects', headers=headers).get_json()['projects'][0]['id']
    before = queries_for(client, count_queries, f'/api/tasks/project/{project_id}', headers)
    for i in range(10):
        create_task(client, headers, project_id, title=f'More {i}')
    assert queries_for(client, count_queries, f'/api/tasks/project/{project_id}', headers) == before


def test_my_tasks_do_not_grow_with_projects(client, count_queries):
    headers = build_projects(client, 1)
    one = queries_for(client, count_queries, '/api/tasks/my-tasks', headers)
    headers_again = headers
    me = client.get('/api/auth/me', headers=headers).get_json()['user']
    for p in range(4):
        project = create_project(client, headers_again, title=f'Extra {p}')
        create_task(client, headers_again, project['id'], assigned_to=me['id'])
    assert queries_for(client, count_queries, '/api/tasks/my-tasks', headers) == one
