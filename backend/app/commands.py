import click
from flask.cli import with_appcontext
from app import db
from app.models.user import User
from app.models.project import Project
from app.models.task import Task

@click.command('list-users')
@with_appcontext
def list_users_command():
    """List all users in the database"""
    users = User.query.all()
    
    if not users:
        click.echo("No users found in database.")
        return
    
    click.echo(f"\n{'ID':<5} {'Email':<30} {'Name':<30} {'Active':<10}")
    click.echo("-" * 80)
    
    for user in users:
        full_name = f"{user.first_name} {user.last_name}"
        active = "✓" if user.is_active else "✗"
        click.echo(f"{user.id:<5} {user.email:<30} {full_name:<30} {active:<10}")
    
    click.echo(f"\nTotal users: {len(users)}\n")

@click.command('list-projects')
@with_appcontext
def list_projects_command():
    """List all projects in the database"""
    projects = Project.query.all()
    
    if not projects:
        click.echo("No projects found in database.")
        return
    
    click.echo(f"\n{'ID':<5} {'Title':<40} {'Owner':<20} {'Status':<15}")
    click.echo("-" * 85)
    
    for project in projects:
        owner_name = f"{project.owner.first_name} {project.owner.last_name}"
        click.echo(f"{project.id:<5} {project.title:<40} {owner_name:<20} {project.status:<15}")
    
    click.echo(f"\nTotal projects: {len(projects)}\n")

@click.command('db-stats')
@with_appcontext
def db_stats_command():
    """Show database statistics"""
    user_count = User.query.count()
    project_count = Project.query.count()
    task_count = Task.query.count()
    
    click.echo("\n📊 Database Statistics")
    click.echo("=" * 40)
    click.echo(f"Users:    {user_count}")
    click.echo(f"Projects: {project_count}")
    click.echo(f"Tasks:    {task_count}")
    click.echo("=" * 40 + "\n")

def init_app(app):
    """Register commands with Flask app"""
    app.cli.add_command(list_users_command)
    app.cli.add_command(list_projects_command)
    app.cli.add_command(db_stats_command)
