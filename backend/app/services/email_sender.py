"""Where emails go. Pick one with EMAIL_BACKEND; the rest of the app only calls send().

console: prints emails to the backend terminal (local development)
memory:  keeps them in a list (tests)
resend:  sends them through resend.com (production)
"""
import json
import logging
from dataclasses import dataclass
from urllib.request import Request, urlopen

from flask import current_app

logger = logging.getLogger(__name__)


@dataclass
class EmailMessage:
    to: str
    subject: str
    text: str


class ConsoleEmailSender:
    def send(self, message):
        print(
            '\n' + '=' * 60 +
            f'\nTo: {message.to}\nSubject: {message.subject}\n\n{message.text}\n' +
            '=' * 60 + '\n',
            flush=True,
        )


class MemoryEmailSender:
    def __init__(self):
        self.outbox = []

    def send(self, message):
        self.outbox.append(message)


class ResendEmailSender:
    URL = 'https://api.resend.com/emails'

    def __init__(self, api_key, sender):
        self.api_key = api_key
        self.sender = sender

    def send(self, message):
        body = {'from': self.sender, 'to': [message.to], 'subject': message.subject, 'text': message.text}
        request = Request(self.URL, data=json.dumps(body).encode(), method='POST', headers={
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'CollabU',
        })
        try:
            with urlopen(request, timeout=10) as response:
                response.read()
        except Exception:
            # An email that fails should not undo what the person just did in the app
            logger.exception('Could not send email "%s"', message.subject)


SENDERS = {
    'console': lambda config: ConsoleEmailSender(),
    'memory': lambda config: MemoryEmailSender(),
    'resend': lambda config: ResendEmailSender(config['RESEND_API_KEY'], config['EMAIL_FROM']),
}


def init_email(app):
    app.extensions['email_sender'] = SENDERS[app.config['EMAIL_BACKEND']](app.config)


def send_email(to, subject, text):
    current_app.extensions['email_sender'].send(EmailMessage(to=to, subject=subject, text=text))
