"""Production providers: Resend for email, S3-compatible storage (Supabase) for files,
and the endpoint the daily GitHub Action calls to send digests."""
import io
import json

import pytest
from botocore.stub import Stubber

from app.services import email_sender
from app.services.email_sender import EmailMessage, ResendEmailSender
from app.services.storage import S3Storage


class FakeResponse:
    status = 200

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def read(self):
        return b'{"id": "abc"}'


def test_resend_posts_the_email(monkeypatch):
    sent = []
    monkeypatch.setattr(email_sender, 'urlopen', lambda request, timeout: sent.append(request) or FakeResponse())

    ResendEmailSender('re_key', 'CollabU <hi@example.com>').send(EmailMessage('sam@example.com', 'Hello', 'Body'))

    request = sent[0]
    assert request.full_url == 'https://api.resend.com/emails'
    assert request.get_header('Authorization') == 'Bearer re_key'
    assert json.loads(request.data) == {
        'from': 'CollabU <hi@example.com>', 'to': ['sam@example.com'], 'subject': 'Hello', 'text': 'Body',
    }


def test_a_failed_email_is_logged_not_raised(monkeypatch, caplog):
    def broken(request, timeout):
        raise OSError('network down')
    monkeypatch.setattr(email_sender, 'urlopen', broken)
    # Alembic's logging setup (in the migration tests) switches existing loggers off
    monkeypatch.setattr(email_sender.logger, 'disabled', False)

    ResendEmailSender('re_key', 'from@example.com').send(EmailMessage('sam@example.com', 'Hello', 'Body'))

    assert 'Could not send email' in caplog.text


@pytest.fixture
def s3():
    storage = S3Storage(endpoint_url='https://example.supabase.co/storage/v1/s3', region='us-east-1',
                        bucket='files', access_key_id='id', secret_access_key='secret')
    with Stubber(storage.client) as stubber:
        yield storage, stubber


def test_s3_saves_opens_and_deletes(s3):
    storage, stubber = s3
    stubber.add_response('put_object', {}, {'Bucket': 'files', 'Key': 'abc', 'Body': b'hello'})
    stubber.add_response('get_object', {'Body': io.BytesIO(b'hello')}, {'Bucket': 'files', 'Key': 'abc'})
    stubber.add_response('delete_object', {}, {'Bucket': 'files', 'Key': 'abc'})

    storage.save('abc', b'hello')
    assert storage.open('abc').read() == b'hello'
    storage.delete('abc')
    stubber.assert_no_pending_responses()


def test_digest_endpoint_needs_the_shared_token(app, client):
    app.config['DIGEST_TOKEN'] = 'secret-token'

    assert client.post('/api/digest').status_code == 403
    assert client.post('/api/digest', headers={'X-Digest-Token': 'wrong'}).status_code == 403
    response = client.post('/api/digest', headers={'X-Digest-Token': 'secret-token'})
    assert response.status_code == 200
    assert response.get_json() == {'sent': 0}


def test_digest_endpoint_is_off_without_a_token(app, client):
    app.config['DIGEST_TOKEN'] = None
    assert client.post('/api/digest', headers={'X-Digest-Token': ''}).status_code == 404
