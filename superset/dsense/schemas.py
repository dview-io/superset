from marshmallow import Schema, fields, validate

class LoginSchema(Schema):
    email = fields.Str(required=True, description="User email address")
    password = fields.Str(required=True, description="User password")

