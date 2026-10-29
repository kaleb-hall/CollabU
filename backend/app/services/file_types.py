"""Which uploads are allowed, checked by extension AND by the file's first bytes.

Trusting only the name or the browser's content type would let someone upload
an .exe renamed to .pdf.
"""

SIGNATURES = {
    'pdf': (b'%PDF',),
    'png': (b'\x89PNG\r\n\x1a\n',),
    'jpg': (b'\xff\xd8\xff',),
    'jpeg': (b'\xff\xd8\xff',),
    'gif': (b'GIF87a', b'GIF89a'),
    'docx': (b'PK\x03\x04',),
    'xlsx': (b'PK\x03\x04',),
    'pptx': (b'PK\x03\x04',),
    'zip': (b'PK\x03\x04',),
}

CONTENT_TYPES = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'zip': 'application/zip',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'md': 'text/markdown',
}

TEXT_TYPES = {'txt', 'csv', 'md'}
ALLOWED_EXTENSIONS = sorted(CONTENT_TYPES)


def extension(filename):
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''


def looks_like_text(head):
    if b'\x00' in head:
        return False
    try:
        head.decode('utf-8')
    except UnicodeDecodeError:
        # The sample may cut a multi-byte character in half at the end
        try:
            head[:-3].decode('utf-8')
        except UnicodeDecodeError:
            return False
    return True


def detect_type(filename, head):
    """The content type to store, or None if the file is not allowed."""
    ext = extension(filename)
    if ext not in CONTENT_TYPES:
        return None
    if ext in TEXT_TYPES:
        return CONTENT_TYPES[ext] if looks_like_text(head) else None
    if ext == 'webp':
        return CONTENT_TYPES[ext] if head[:4] == b'RIFF' and head[8:12] == b'WEBP' else None
    return CONTENT_TYPES[ext] if head.startswith(SIGNATURES[ext]) else None
