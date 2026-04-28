"""Email notification service.

Planned features:
- Deadline approaching reminders (24h, 48h before due date)
- Task assignment notifications
- Weekly project digest emails
- Team invitation emails

Will use Flask-Mail with SMTP configuration.
"""


class EmailService:

    @staticmethod
    def send_deadline_reminder(user_email, task_title, due_date):
        """Send a reminder email for an approaching deadline."""
        raise NotImplementedError("Email service is planned for a future release.")

    @staticmethod
    def send_task_assignment(user_email, task_title, project_title):
        """Notify a user they've been assigned a task."""
        raise NotImplementedError("Email service is planned for a future release.")

    @staticmethod
    def send_team_invite(user_email, project_title, inviter_name):
        """Send a project invitation email."""
        raise NotImplementedError("Email service is planned for a future release.")
