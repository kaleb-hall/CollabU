"""Fails if a model changes without a matching migration (or the migrations do not run)."""
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from flask_migrate import downgrade, upgrade

from app import create_app, db


def test_migrations_match_models(tmp_path, monkeypatch):
    monkeypatch.setenv('DATABASE_URL', f"sqlite:///{tmp_path / 'migrations.db'}")
    app = create_app('development')
    with app.app_context():
        upgrade()
        with db.engine.connect() as connection:
            diff = compare_metadata(MigrationContext.configure(connection), db.metadata)
        assert diff == []
        downgrade(revision='base')
