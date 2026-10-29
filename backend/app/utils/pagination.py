"""Cursor pagination for lists that only grow (newest first).

Clients pass ?limit=20&before=<id>; responses include next_cursor (None at the end).
"""
from marshmallow import Schema, fields, validate


class PageArgsSchema(Schema):
    limit = fields.Int(load_default=20, validate=validate.Range(min=1, max=50))
    before = fields.Int(load_default=None, validate=validate.Range(min=1))


def paginate(query, model, args):
    if args['before']:
        query = query.filter(model.id < args['before'])
    items = query.order_by(model.id.desc()).limit(args['limit'] + 1).all()
    has_more = len(items) > args['limit']
    items = items[:args['limit']]
    return items, (items[-1].id if has_more else None)
