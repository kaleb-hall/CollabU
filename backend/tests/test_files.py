import io
import os

from app.services.file_types import detect_type
from tests.conftest import create_project, create_task, get_json, join_project, register

PDF = b'%PDF-1.4\n1 0 obj\n<<>>\nendobj\n'
PNG = b'\x89PNG\r\n\x1a\n' + b'\x00' * 20


def upload(client, headers, project_id, name='notes.pdf', content=PDF, task_id=None):
    data = {'file': (io.BytesIO(content), name)}
    if task_id:
        data['task_id'] = str(task_id)
    return client.post(f'/api/projects/{project_id}/files', data=data, headers=headers, content_type='multipart/form-data')


def team(client):
    ana, ana_headers = register(client)
    sam, sam_headers = register(client, email='sam@example.com', first_name='Sam', last_name='Kim')
    project = create_project(client, ana_headers)
    join_project(project['id'], sam['id'])
    return ana_headers, sam_headers, project


# detect_type

def test_detects_types_from_content_not_just_the_name():
    assert detect_type('notes.pdf', PDF) == 'application/pdf'
    assert detect_type('photo.png', PNG) == 'image/png'
    assert detect_type('notes.txt', 'Hello there'.encode()) == 'text/plain'
    assert detect_type('table.csv', b'a,b\n1,2\n') == 'text/csv'


def test_rejects_a_file_pretending_to_be_something_else():
    assert detect_type('virus.pdf', b'MZ\x90\x00 not a pdf') is None
    assert detect_type('photo.png', PDF) is None
    assert detect_type('notes.txt', b'\x00\x01\x02 binary') is None


def test_rejects_types_we_do_not_allow():
    assert detect_type('run.exe', b'MZ\x90\x00') is None
    assert detect_type('page.html', b'<script>alert(1)</script>') is None
    assert detect_type('no_extension', PDF) is None


# upload

def test_upload_and_list(client):
    ana, _, project = team(client)
    response = upload(client, ana, project['id'])
    assert response.status_code == 201, response.get_json()
    created = response.get_json()['file']
    assert created['filename'] == 'notes.pdf'
    assert created['content_type'] == 'application/pdf'
    assert created['size'] == len(PDF)
    assert created['uploader']['first_name'] == 'Ana'
    assert 'storage_key' not in created

    files = get_json(client, f"/api/projects/{project['id']}/files", ana)['files']
    assert [f['id'] for f in files] == [created['id']]


def test_upload_to_a_task_and_filter_by_task(client):
    ana, _, project = team(client)
    task = create_task(client, ana, project['id'])
    upload(client, ana, project['id'], name='a.pdf')
    on_task = upload(client, ana, project['id'], name='b.pdf', task_id=task['id']).get_json()['file']
    assert on_task['task_id'] == task['id']
    files = get_json(client, f"/api/projects/{project['id']}/files?task_id={task['id']}", ana)['files']
    assert [f['filename'] for f in files] == ['b.pdf']


def test_task_must_be_in_the_same_project(client):
    ana, _, project = team(client)
    other = create_project(client, ana, title='Other')
    task = create_task(client, ana, other['id'])
    assert upload(client, ana, project['id'], task_id=task['id']).status_code == 400


def test_filename_is_made_safe(client):
    ana, _, project = team(client)
    created = upload(client, ana, project['id'], name='../../etc/My Notes.pdf').get_json()['file']
    assert created['filename'] == 'etc_My_Notes.pdf'


def test_rejects_disallowed_and_fake_files(client):
    ana, _, project = team(client)
    response = upload(client, ana, project['id'], name='tool.exe', content=b'MZ\x90\x00')
    assert response.status_code == 400
    assert 'file' in response.get_json()['error']['details']
    assert upload(client, ana, project['id'], name='fake.pdf', content=b'not really').status_code == 400


def test_rejects_empty_and_missing_files(client):
    ana, _, project = team(client)
    assert upload(client, ana, project['id'], content=b'').status_code == 400
    response = client.post(f"/api/projects/{project['id']}/files", data={}, headers=ana, content_type='multipart/form-data')
    assert response.status_code == 400


def test_rejects_files_over_the_size_limit(app, client):
    ana, _, project = team(client)
    app.config['MAX_UPLOAD_BYTES'] = 100
    response = upload(client, ana, project['id'], content=PDF + b'x' * 200)
    assert response.status_code == 400
    assert 'too big' in response.get_json()['error']['details']['file'][0]


def test_huge_requests_are_cut_off_with_json_error(app, client):
    ana, _, project = team(client)
    app.config['MAX_CONTENT_LENGTH'] = 1000
    response = upload(client, ana, project['id'], content=PDF + b'x' * 5000)
    assert response.status_code == 413
    assert response.get_json()['error']['code'] == 'PAYLOAD_TOO_LARGE'


def test_non_members_cannot_upload_list_or_download(client):
    ana, _, project = team(client)
    _, stranger = register(client, email='x@example.com')
    created = upload(client, ana, project['id']).get_json()['file']
    assert upload(client, stranger, project['id']).status_code == 403
    assert client.get(f"/api/projects/{project['id']}/files", headers=stranger).status_code == 403
    assert client.get(f"/api/files/{created['id']}/download", headers=stranger).status_code == 403


# download

def test_download_returns_the_bytes_as_an_attachment(client):
    ana, sam, project = team(client)
    created = upload(client, ana, project['id']).get_json()['file']
    response = client.get(f"/api/files/{created['id']}/download", headers=sam)
    assert response.status_code == 200
    assert response.data == PDF
    assert response.headers['Content-Type'] == 'application/pdf'
    assert 'attachment' in response.headers['Content-Disposition']
    assert 'notes.pdf' in response.headers['Content-Disposition']
    assert response.headers['X-Content-Type-Options'] == 'nosniff'


def test_missing_file_is_404(client):
    ana, _, _ = team(client)
    assert client.get('/api/files/999/download', headers=ana).status_code == 404


# delete

def test_uploader_can_delete(app, client):
    ana, sam, project = team(client)
    created = upload(client, sam, project['id']).get_json()['file']
    assert client.delete(f"/api/files/{created['id']}", headers=sam).status_code == 204
    assert get_json(client, f"/api/projects/{project['id']}/files", sam)['files'] == []
    assert os.listdir(app.config['UPLOAD_FOLDER']) == []


def test_project_owner_can_delete_anyones_file(client):
    ana, sam, project = team(client)
    created = upload(client, sam, project['id']).get_json()['file']
    assert client.delete(f"/api/files/{created['id']}", headers=ana).status_code == 204


def test_other_members_cannot_delete(client):
    ana, _, project = team(client)
    lee, lee_headers = register(client, email='lee@example.com')
    join_project(project['id'], lee['id'])
    created = upload(client, ana, project['id']).get_json()['file']
    assert client.delete(f"/api/files/{created['id']}", headers=lee_headers).status_code == 403


def test_deleting_a_project_removes_stored_files(app, client):
    ana, _, project = team(client)
    upload(client, ana, project['id'])
    assert len(os.listdir(app.config['UPLOAD_FOLDER'])) == 1
    client.delete(f"/api/projects/{project['id']}", headers=ana)
    assert os.listdir(app.config['UPLOAD_FOLDER']) == []


def test_deleting_a_task_keeps_its_files_on_the_project(client):
    ana, _, project = team(client)
    task = create_task(client, ana, project['id'])
    upload(client, ana, project['id'], task_id=task['id'])
    client.delete(f"/api/tasks/{task['id']}", headers=ana)
    files = get_json(client, f"/api/projects/{project['id']}/files", ana)['files']
    assert len(files) == 1 and files[0]['task_id'] is None


def test_upload_is_logged_in_activity(client):
    ana, _, project = team(client)
    upload(client, ana, project['id'])
    activity = get_json(client, f"/api/projects/{project['id']}/activity", ana)['activities'][0]
    assert activity['description'] == 'Ana Lee added "notes.pdf"'
