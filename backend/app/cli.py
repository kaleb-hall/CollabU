import click

from app.services.email_service import send_due_digests


def register_commands(app):
    @app.cli.command('send-digest')
    def send_digest():
        """Email each user their tasks due in the next 24 hours. Run once a day."""
        count = send_due_digests()
        click.echo(f'Sent {count} digest email{"" if count == 1 else "s"}')

    @app.cli.command('seed')
    def seed_demo():
        """Create (or reset) demo users, projects, tasks, busy time, comments and notifications."""
        from app.seed import DEMO_PASSWORD, PEOPLE, seed
        seed()
        click.echo('Demo data is ready. Log in as any of these, password ' + DEMO_PASSWORD + ':')
        for email, first_name, last_name in PEOPLE:
            click.echo(f'  {email}  ({first_name} {last_name})')
