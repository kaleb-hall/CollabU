import click

from app.services.email_service import send_due_digests


def register_commands(app):
    @app.cli.command('send-digest')
    def send_digest():
        """Email each user their tasks due in the next 24 hours. Run once a day."""
        count = send_due_digests()
        click.echo(f'Sent {count} digest email{"" if count == 1 else "s"}')
