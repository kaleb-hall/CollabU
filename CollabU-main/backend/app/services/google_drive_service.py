"""Google Drive integration service.

Planned features:
- OAuth 2.0 authentication with Google
- Link Google Drive files to projects and tasks
- File preview and metadata retrieval
- Shared folder creation per project

Requires GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET env vars.
"""


class GoogleDriveService:

    @staticmethod
    def authorize(auth_code):
        """Exchange OAuth code for access token."""
        raise NotImplementedError("Google Drive integration is planned for a future release.")

    @staticmethod
    def list_files(access_token, folder_id=None):
        """List files in a Google Drive folder."""
        raise NotImplementedError("Google Drive integration is planned for a future release.")

    @staticmethod
    def get_file_metadata(access_token, file_id):
        """Retrieve metadata for a specific file."""
        raise NotImplementedError("Google Drive integration is planned for a future release.")
