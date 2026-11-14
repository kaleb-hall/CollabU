from datetime import datetime, timedelta, timezone

from app import db
from app.models import User
from app.services.email_sender import ConsoleEmailSender, EmailMessage
from app.services.email_service import send_due_digests
from tests.conftest import create_project, create_task, register


def iso_from_now(**delta):
    return (datetime.now(timezone.utc) + timedelta(**delta)).strftime('%Y-%m-%dT%H:%M:%SZ')


def test_console_sender_prints_the_email(capsys):
    ConsoleEmailSender().send(EmailMessage(to='a@b.c', subject='Hello', text='Body text'))
    printed = capsys.readouterr().out
    assert 'To: a@b.c' in printed and 'Subject: Hello' in printed and 'Body text' in printed


def test_login_saves_the_browser_timezone(client):
    register(client)
    client.post('/api/auth/login', json={
        'email': 'ana@example.com', 'password': 'Passw0rdA', 'timezone': 'America/Chicago',
    })
    assert User.query.one().timezone == 'America/Chicago'


def test_unknown_timezone_is_ignored_on_login(client):
    register(client)
    response = client.post('/api/auth/login', json={
        'email': 'ana@example.com', 'password': 'Passw0rdA', 'timezone': 'Nowhere/Land',
    })
    assert response.status_code == 200
    assert User.query.one().timezone == 'UTC'


def test_digest_lists_tasks_due_soon_in_local_time(app, client, outbox):
    ana, headers = register(client)
    User.query.one().timezone = 'America/Los_Angeles'
    db.session.commit()
    project = create_project(client, headers, title='Essay')
    create_task(client, headers, project['id'], title='Soon', assigned_to=ana['id'], due_date=iso_from_now(hours=3))
    create_task(client, headers, project['id'], title='Later', assigned_to=ana['id'], due_date=iso_from_now(days=4))

    assert send_due_digests() == 1
    assert len(outbox) == 1
    email = outbox[0]
    assert email.to == 'ana@example.com'
    assert 'Soon' in email.text and 'Essay' in email.text and 'Later' not in email.text
    assert 'PST' in email.text or 'PDT' in email.text


def test_digest_skips_people_who_opted_out_or_have_nothing_due(client, outbox):
    ana, headers = register(client)
    register(client, email='sam@example.com')
    project = create_project(client, headers)
    create_task(client, headers, project['id'], assigned_to=ana['id'], due_date=iso_from_now(hours=3))
    User.query.filter_by(email='ana@example.com').one().email_notifications = False
    db.session.commit()
    assert send_due_digests() == 0
    assert outbox == []


def test_digest_command(app, client, outbox):
    ana, headers = register(client)
    project = create_project(client, headers)
    create_task(client, headers, project['id'], assigned_to=ana['id'], due_date=iso_from_now(hours=3))
    result = app.test_cli_runner().invoke(args=['send-digest'])
    assert result.exit_code == 0
    assert 'Sent 1 digest email' in result.output
