"""Where emails go. Pick one with EMAIL_BACKEND; the rest of the app only calls send().

console: prints emails to the backend terminal (local development)
memory:  keeps them in a list (tests)
A real provider (production) will be one more class with the same send() method.
"""
from dataclasses import dataclass

from flask import current_app


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


SENDERS = {'console': ConsoleEmailSender, 'memory': MemoryEmailSender}


def init_email(app):
    app.extensions['email_sender'] = SENDERS[app.config['EMAIL_BACKEND']]()


def send_email(to, subject, text):
    current_app.extensions['email_sender'].send(EmailMessage(to=to, subject=subject, text=text))
