"""Big project updates: tell the team in the app, and by email to those who want it.

Only for moments that matter (a member finishing all their tasks, the project finishing,
the final note), not for every task. The caller commits.
"""
from app.models import ProjectMember
from app.services import email_service, notification_service


def announce(project, title, message=None, skip=()):
    link = notification_service.project_link(project.id)
    members = ProjectMember.query.filter(
        ProjectMember.project_id == project.id,
        ProjectMember.user_id.notin_(list(skip)),
    ).all()
    for member in members:
        notification_service.notify(member.user_id, 'milestone', title, message=message, link=link)
        if member.email_updates and member.user.email_notifications:
            email_service.send_project_update(member.user, project, title, message)
