"""Where uploaded file bytes live. The rest of the app only uses save, open and delete.

local: a folder on disk (development).
s3:    any S3-compatible bucket (production). We use Supabase Storage, which speaks
       the S3 protocol, so moving to Cloudflare R2 or AWS S3 later is only new settings.
       Render wipes its disk on every deploy, which is why production cannot use local.
"""
import io
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


class S3Storage:
    def __init__(self, endpoint_url, region, bucket, access_key_id, secret_access_key):
        import boto3  # only loaded when s3 storage is used
        from botocore.config import Config

        self.bucket = bucket
        self.client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            region_name=region,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            # Supabase wants bucket names in the path, not in the host name
            config=Config(s3={'addressing_style': 'path'}),
        )

    def save(self, key, data):
        self.client.put_object(Bucket=self.bucket, Key=key, Body=data)

    def open(self, key):
        # Files are at most 10 MB, so reading into memory keeps downloads simple
        body = self.client.get_object(Bucket=self.bucket, Key=key)['Body']
        return io.BytesIO(body.read())

    def delete(self, key):
        self.client.delete_object(Bucket=self.bucket, Key=key)


def init_storage(app):
    config = app.config
    if config['STORAGE_BACKEND'] == 's3':
        app.extensions['storage'] = S3Storage(
            endpoint_url=config['S3_ENDPOINT_URL'],
            region=config['S3_REGION'],
            bucket=config['S3_BUCKET'],
            access_key_id=config['S3_ACCESS_KEY_ID'],
            secret_access_key=config['S3_SECRET_ACCESS_KEY'],
        )
    else:
        app.extensions['storage'] = LocalStorage(config['UPLOAD_FOLDER'])


def storage():
    return current_app.extensions['storage']
