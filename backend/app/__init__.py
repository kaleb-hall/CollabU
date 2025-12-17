from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from app.config import config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
mail = Mail()

def create_app(config_name='development'):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])
    mail.init_app(app)
    
    # Register blueprints
    from app.controllers.auth_controller import auth_bp
    from app.controllers.user_controller import user_bp
    from app.controllers.project_controller import project_bp
    from app.controllers.task_controller import task_bp
    from app.controllers.calendar_controller import calendar_bp
    from app.controllers.notification_controller import notification_bp
    from app.controllers.file_controller import file_bp
    from app.controllers.deadline_controller import deadline_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(project_bp, url_prefix='/api/projects')
    app.register_blueprint(task_bp, url_prefix='/api/tasks')
    app.register_blueprint(calendar_bp, url_prefix='/api/calendar')
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')
    app.register_blueprint(file_bp, url_prefix='/api/files')
    app.register_blueprint(deadline_bp, url_prefix='/api/deadline')
    
    # Register custom commands (optional)
    try:
        from app import commands
        commands.init_app(app)
    except ImportError:
        pass  # Commands are optional
    
    # Health check route
    @app.route('/api/health')
    def health_check():
        return {'status': 'ok', 'message': 'CollabU API is running'}
    
    return app
