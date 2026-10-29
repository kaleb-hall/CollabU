from marshmallow import fields

from app.utils.time import iso_utc, to_utc


class UtcDateTime(fields.DateTime):
    """Accepts any ISO datetime, stores naive UTC, returns ISO with a Z."""

    def _deserialize(self, value, attr, data, **kwargs):
        return to_utc(super()._deserialize(value, attr, data, **kwargs))

    def _serialize(self, value, attr, obj, **kwargs):
        return iso_utc(value)
