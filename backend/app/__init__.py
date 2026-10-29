from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_name=None):
    from app.config import load_config
    from app.errors import register_error_handlers

    app = Flask(__name__)
    app.config.update(load_config(config_name))

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'], allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    register_error_handlers(app, jwt)
    register_blueprints(app)
    return app


def register_blueprints(app):
    from app.controllers.auth_controller import auth_bp
    from app.controllers.calendar_controller import calendar_bp
    from app.controllers.notification_controller import notification_bp
    from app.controllers.project_controller import project_bp
    from app.controllers.task_controller import task_bp
    from app.controllers.user_controller import user_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(project_bp, url_prefix='/api/projects')
    app.register_blueprint(task_bp, url_prefix='/api/tasks')
    app.register_blueprint(calendar_bp, url_prefix='/api/calendar')
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')


from app import models  # noqa: E402,F401
