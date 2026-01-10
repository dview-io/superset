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
from flask import request


referer = cosmos_url = app.config.get("APPOLO_REFERER")
origin = cosmos_url = app.config.get("APPOLO_ORIGIN")

headers = {"Content-Type": "application/json", "Origin": origin, "Referer": referer}


class Dsense(BaseSupersetApi):
    """
    Custom API for handling user login by forwarding to COSMOS_URL.
    """

    resource_name = "dsense"
    include_route_methods = {
        "dsense_login",
        "get_dview_login",
        "check_for_admin_user",
        "get_schemas",
        "get_tables",
    }
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
            "Origin": origin,
            "Referer": referer,
        }

        try:
            response = session.post(
                login_endpoint,
                json={
                    "email": current_user.email,
                    "pass": current_user.password,
                },
                headers=headers,
            )
            token_cookie = {}

            for cookie in response.raw.headers.getlist("set-cookie"):
                token_cookie = {"cookie_token": cookie}
            body = json.dumps(token_cookie)
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
                    "password": current_user.password,
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
                    "password": current_user.password,
                }
            )
        return self.response(401, message="Not authenticated", success=False)

    @expose("/dview/schemas", methods=["GET"])
    def get_schemas(self) -> Response:
        """
        Fetch schemas for Dsense for the current user/org.
        ---
        get:
          summary: Get available schemas for Dsense
          parameters:
            - in: query
              name: catalog
              schema:
                type: string
              required: true
              description: Catalog / database name
          responses:
            200:
              description: Schema list
            401:
              description: Not authenticated
            500:
              description: Failed to fetch schemas
        """

        # ------------------------
        # Auth check
        # ------------------------

        catalog = request.args.get("catalog")
        if not catalog:
            return self.response(
                400,
                message="Missing required query param: catalog",
                success=False,
            )

        cosmos_url = app.config.get("COSMOS_ENDPOINT")
        if not cosmos_url:
            app.logger.error("COSMOS_ENDPOINT not configured")
            return self.response(
                500,
                message="COSMOS endpoint not configured",
                success=False,
            )

        org_name = get_org_info(current_user.email)

        endpoint = (
            f"{cosmos_url}/orchestrator/analytics/run-query/dview"
            f"?email={current_user.email}&org={org_name}"
        )

        headers = {
            "Content-Type": "application/json",
            "Origin": app.config.get("APPOLO_ORIGIN"),
            "Referer": app.config.get("APPOLO_REFERER"),
        }

        try:
            resp = requests.post(
                endpoint,
                headers=headers,
                json={"catalog": catalog},
                timeout=10,
            )
        except requests.RequestException:
            app.logger.exception("Failed to reach Cosmos for schema list")
            return self.response(
                500,
                message="Failed to reach Cosmos service",
                success=False,
            )

        if resp.status_code != 200:
            app.logger.error(
                "Cosmos schema fetch failed: %s - %s",
                resp.status_code,
                resp.text,
            )
            return self.response(
                500,
                message="Failed to fetch schemas",
                success=False,
            )

        try:
            payload = resp.json()
        except ValueError:
            app.logger.error("Invalid JSON returned from Cosmos")
            return self.response(
                500,
                message="Invalid response from Cosmos",
                success=False,
            )

        # Normalize Cosmos response
        schemas = []
        if payload:
            for pay in payload:
                schemas.append(pay["Schema"])
        # schemas = payload.get("schemas") or payload.get("result") or []

        return self.response(
            200,
            success=True,
            schemas=schemas,
        )

    @expose("/dview/tables", methods=["GET"])
    def get_tables(self) -> Response:
        """
        Fetch tables for Dsense for the current user/org.
        ---
        get:
          summary: Get available tables for Dsense
          parameters:
            - in: query
              name: catalog
              schema:
                type: string
              required: true
              description: Catalog / database name
            - in: query
              name: schema
              schema:
                type: string
              required: true
              description: Schema name
          responses:
            200:
              description: Table list
            401:
              description: Not authenticated
            500:
              description: Failed to fetch tables
        """

        # ------------------------
        # Auth check
        # ------------------------

        catalog = request.args.get("catalog")
        schema = request.args.get("schema")
        if not catalog:
            return self.response(
                400,
                message="Missing required query param: catalog",
                success=False,
            )
        if not schema:
            return self.response(
                400,
                message="Missing required query param: schema",
                success=False,
            )

        cosmos_url = app.config.get("COSMOS_ENDPOINT")
        if not cosmos_url:
            app.logger.error("COSMOS_ENDPOINT not configured")
            return self.response(
                500,
                message="COSMOS endpoint not configured",
                success=False,
            )

        org_name = get_org_info(current_user.email)

        endpoint = (
            f"{cosmos_url}/orchestrator/analytics/run-query/dview"
            f"?email={current_user.email}&org={org_name}"
        )

        headers = {
            "Content-Type": "application/json",
            "Origin": app.config.get("APPOLO_ORIGIN"),
            "Referer": app.config.get("APPOLO_REFERER"),
        }

        try:
            resp = requests.post(
                endpoint,
                headers=headers,
                json={"catalog": catalog, "schema": schema},
                timeout=10,
            )
        except requests.RequestException:
            app.logger.exception("Failed to reach Cosmos for table list")
            return self.response(
                500,
                message="Failed to reach Cosmos service",
                success=False,
            )

        if resp.status_code != 200:
            app.logger.error(
                "Cosmos table fetch failed: %s - %s",
                resp.status_code,
                resp.text,
            )
            return self.response(
                500,
                message="Failed to fetch tables",
                success=False,
            )

        try:
            payload = resp.json()
        except ValueError:
            app.logger.error("Invalid JSON returned from Cosmos")
            return self.response(
                500,
                message="Invalid response from Cosmos",
                success=False,
            )

        # Normalize Cosmos response
        tables = []
        if payload:
            for pay in payload:
                tables.append(pay["Table"])
        # schemas = payload.get("schemas") or payload.get("result") or []

        return self.response(
            200,
            success=True,
            tables=tables,
        )
