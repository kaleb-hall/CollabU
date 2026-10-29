"""Where uploaded file bytes live. The rest of the app only uses save, open and delete.

local: a folder on disk (development). Render wipes its disk on every deploy,
so production needs a cloud backend: one more class with the same three methods.
"""
import os

from flask import current_app


class LocalStorage:
    def __init__(self, root):
        self.root = root
        os.makedirs(root, exist_ok=True)

    def path(self, key):
        return os.path.join(self.root, key)

    def save(self, key, data):
        with open(self.path(key), 'wb') as handle:
            handle.write(data)

    def open(self, key):
        return open(self.path(key), 'rb')

    def delete(self, key):
        try:
            os.remove(self.path(key))
        except FileNotFoundError:
            pass


def init_storage(app):
    app.extensions['storage'] = LocalStorage(app.config['UPLOAD_FOLDER'])


def storage():
    return current_app.extensions['storage']
