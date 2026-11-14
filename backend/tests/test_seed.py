"""flask seed: demo data for trying the app locally."""
from app.models import CalendarBlock, Comment, Notification, Project, Task, User
from app.schemas.task_schema import TASK_STATUSES
from tests.conftest import register


def run_seed(app):
    result = app.test_cli_runner().invoke(args=['seed'])
    assert result.exit_code == 0, result.output
    return result.output


def test_seed_creates_a_demo_world(app, client):
    output = run_seed(app)

    assert 'demo@collabu.test' in output
    demo = User.query.filter_by(email='demo@collabu.test').one()
    assert demo.check_password('Demo1234!')
    projects = Project.query.filter_by(created_by=demo.id).all()
    assert len(projects) == 2
    statuses = {task.status for task in Task.query.all()}
    assert statuses == set(TASK_STATUSES)
    assert CalendarBlock.query.filter(CalendarBlock.user_id == demo.id, CalendarBlock.repeat_days_csv.isnot(None)).count() >= 1
    assert Comment.query.count() >= 2
    assert Notification.query.filter_by(user_id=demo.id).count() >= 1

    login = client.post('/api/auth/login', json={'email': 'demo@collabu.test', 'password': 'Demo1234!'})
    assert login.status_code == 200


def test_seed_can_run_again_and_leaves_other_people_alone(app, client):
    register(client, email='real@example.com')
    run_seed(app)
    run_seed(app)

    assert User.query.filter_by(email='demo@collabu.test').count() == 1
    assert Project.query.count() == 2
    assert User.query.filter_by(email='real@example.com').count() == 1
