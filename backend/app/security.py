"""Security headers on every response, the real client address behind Render's proxy,
and the rate limiter for login and register."""
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix

limiter = Limiter(key_func=get_remote_address)

# The API only returns JSON and files, so nothing may be framed, scripted or embedded
API_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
HSTS = 'max-age=31536000; includeSubDomains'


def init_security(app):
    if app.config['PRODUCTION']:
        # Render puts one proxy in front of the app; trust its X-Forwarded-For and -Proto
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
    limiter.init_app(app)

    @app.after_request
    def add_security_headers(response):
        response.headers.setdefault('X-Content-Type-Options', 'nosniff')
        response.headers.setdefault('X-Frame-Options', 'DENY')
        response.headers.setdefault('Referrer-Policy', 'no-referrer')
        response.headers.setdefault('Content-Security-Policy', API_CSP)
        if app.config['PRODUCTION']:
            response.headers.setdefault('Strict-Transport-Security', HSTS)
        return response
