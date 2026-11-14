from app import db
from app.errors import Forbidden, NotFound
from app.models import Comment
from app.services import activity_service


def comments_for(task):
    return Comment.query.filter_by(task_id=task.id).order_by(Comment.id).all()


def add_comment(task, author_id, body):
    comment = Comment(task_id=task.id, user_id=author_id, body=body)
    db.session.add(comment)
    activity_service.log(task.project_id, author_id, 'comment_added', f'commented on "{task.title}"', 'task', task.id)
    db.session.commit()
    return comment


def delete_comment(task, comment_id, user_id):
    comment = Comment.query.filter_by(id=comment_id, task_id=task.id).first()
    if not comment:
        raise NotFound('Comment not found')
    if comment.user_id != user_id:
        raise Forbidden('You can only delete your own comments')
    db.session.delete(comment)
    db.session.commit()
