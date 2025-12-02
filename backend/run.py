import os
from app import create_app, db

# Get config from environment or use development
config_name = os.environ.get('FLASK_ENV', 'development')
app = create_app(config_name)

@app.shell_context_processor
def make_shell_context():
    """Make database and models available in flask shell"""
    return {
        'db': db,
        # Add your models here as you create them
        # 'User': User,
        # 'Project': Project,
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)