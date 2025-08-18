import json
from marshmallow import ValidationError
from flask import request, jsonify, current_app as app, Response
from flask_appbuilder.api import expose, permission_name, protect
from superset.dsense.schemas import LoginSchema
from superset.views.base_api import BaseSupersetApi, requires_json
from flask_babel import lazy_gettext as _
import requests
from werkzeug.datastructures import Headers  # type: ignore
from flask_login import current_user
from superset.custom_security.utils_file import get_org_info

headers = {
    "Content-Type": "application/json",
}


class Dsense(BaseSupersetApi):
    """
    Custom API for handling user login by forwarding to COSMOS_URL.
    """

    resource_name = "dsense"
    include_route_methods = {"dsense_login", "get_dview_login", "check_for_admin_user"}
    csrf_exempt = True

    @expose("/login", methods=["GET"])
    def dsense_login(self) -> Response:
        """
        Login API that forwards credentials to COSMOS_URL.
        ---
        get:
          summary: Forward login to COSMOS
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

        # Prepare COSMOS login request
        cosmos_url = app.config.get(
            "COSMOS_ENDPOINT"
        )  # Ensure this is set in superset/config.py
        if not cosmos_url:
            return self.response(
                500, message="COSMOS_URL not configured", success=False
            )

        login_endpoint = f"{cosmos_url}/orchestrator/auth/email-login"
        headers = {
            "Content-Type": "application/json",
        }

        try:
            response = session.post(
                login_endpoint,
                json={
                    "email": current_user.email,
                    "pass": app.config.get("LOGIN_PASSWORD"),
                },
                headers=headers,
            )

            for cookie in response.raw.headers.getlist("set-cookie"):
                token_cookie = {"cookie_token": cookie}
            body = json.dumps(token_cookie or {})
            flask_response = Response(
                body, status=response.status_code, headers=dict(response.headers)
            )

            return flask_response

        except requests.exceptions.RequestException as e:
            return self.response(
                500, message=f"COSMOS API error: {str(e)}", success=False
            )

    @expose("/login/dview", methods=["GET"])
    def get_dview_login(self) -> Response:
        """
        Returns the currently authenticated user's username and email.
        ---
        get:
          summary: Get current authenticated user info
          responses:
            200:
              description: Authenticated user details
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      username:
                        type: string
                      email:
                        type: string
            401:
              description: Not authenticated
        """

        if current_user.is_authenticated:
            return jsonify(
                {
                    "email": current_user.email,
                    "password": app.config.get("LOGIN_PASSWORD"),
                }
            )
        return self.response(401, message="Not authenticated", success=False)

    @expose("/dview/role", methods=["GET"])
    def check_for_admin_user(self) -> Response:
        """
        Returns whether the currently authenticated user is an admin.
        ---
        get:
          summary: Check if the current authenticated user is an admin
          responses:
            200:
              description: User role info
              content:
                application/json:
                  schema:
                    type: object
                    properties:
                      email:
                        type: string
                      is_admin:
                        type: boolean
                      roles:
                        type: array
                        items:
                          type: string
            401:
              description: Not authenticated
        """

        # call user list API
        session = requests.Session()
        cosmos_url = app.config.get("COSMOS_ENDPOINT")
        orgName = get_org_info(current_user.email)

        get_user_list_endpoint = f"{cosmos_url}/orchestrator/auth/users?email={current_user.email}&org={orgName}"

        user_list_response = session.get(get_user_list_endpoint, headers=headers)

        if user_list_response.status_code != 200:
            msg = (
                f"Cosmos get user list failed: "
                f"{user_list_response.status_code} - {user_list_response.text}"
            )
            app.logger.error(msg)
            return self.response(401, message="Not authenticated", success=False)

        app.logger.info("Cosmos List successful. Proceeding with user lookup.")

        matched_user = [
            user
            for user in user_list_response.json()
            if user.get("emailAddress") == current_user.email
        ]

        if not matched_user:
            return self.response(401, message="User not found", success=False)

        user_roles = matched_user[0].get("userRoleList", [])
        is_admin = "ROLE_SYS_ADMIN" in user_roles

        return self.response(200, message="Success", is_admin=is_admin, success=True)
