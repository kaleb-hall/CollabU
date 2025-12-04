import os
from app import create_app, db

# Import all models so Flask-Migrate can detect them
from app.models.user import User
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.task import Task

# Get config from environment or use development
config_name = os.environ.get('FLASK_ENV', 'development')
app = create_app(config_name)

@app.shell_context_processor
def make_shell_context():
    """Make database and models available in flask shell"""
    return {
        'db': db,
        'User': User,
        'Project': Project,
        'ProjectMember': ProjectMember,
        'Task': Task,
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
