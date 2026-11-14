#!/usr/bin/env bash
# Render build: install packages, then bring the database up to date.
# Migrations run here because Render's free plan has no pre-deploy step. If the
# migration fails, the build fails and the old version keeps running.
set -o errexit

pip install -r requirements.txt
FLASK_APP=run.py flask db upgrade
