import json
from marshmallow import ValidationError
from flask import request, jsonify, current_app as app, Response
from flask_appbuilder.api import expose, permission_name, protect
from superset.dsense.schemas import LoginSchema
from superset.views.base_api import BaseSupersetApi, requires_json
from flask_babel import lazy_gettext as _
import requests  # or httpx for async support
from werkzeug.datastructures import Headers # type: ignore


class Dsense(BaseSupersetApi):
    """
    Custom API for handling user login by forwarding to COSMOS_URL.
    """
    resource_name = 'dsense'
    include_route_methods = {"dsense_login"}
    csrf_exempt = True

    @expose('/login', methods=["POST"])
    @requires_json

    def dsense_login(self)-> Response:
        """
        Login API that forwards credentials to COSMOS_URL.
        ---
        post:
          summary: Forward login to COSMOS
          requestBody:
            description: User login data
            required: true
            content:
              application/json:
                schema:
                  type: object
                  properties:
                    email:
                      type: string
                      description: The email address of the user
                    password:
                      type: string
                      description: The password for the user
          responses:
            200:
              description: Login successful
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      cookie_token:
                        type: string
                        description: Login Set Cookie
            400:
              description: Invalid input
            401:
              description: Unauthorized (COSMOS rejection)
            500:
              description: Internal server error
        """
        session = requests.Session()
        payload = request.get_json(force=True)

        # Validate payload
        schema = LoginSchema()
        try:
            data = schema.load(payload)
        except ValidationError as err:
            return self.response(400, message="Invalid input", result=err.messages, success=False)

        # Prepare COSMOS login request
        cosmos_url = app.config.get("COSMOS_ENDPOINT")  # Ensure this is set in superset/config.py
        if not cosmos_url:
            return self.response(500, message="COSMOS_URL not configured", success=False)

        login_endpoint = f"{cosmos_url}/orchestrator/auth/email-login"
        headers = {
            "Content-Type": "application/json",
        }

        try:

            response = session.post(
                login_endpoint,
                json={"email": data["email"], "pass": data["password"]},
                headers=headers,
            )
            print(response.raw.headers)

            for cookie in response.raw.headers.getlist("set-cookie"):
                    token_cookie={"cookie_token":cookie}
            body = json.dumps(token_cookie or {})
            flask_response = Response(
               body,
                status=response.status_code,
                headers=dict(response.headers)
            )


            return flask_response

        except requests.exceptions.RequestException as e:
            return self.response(500, message=f"COSMOS API error: {str(e)}", success=False)