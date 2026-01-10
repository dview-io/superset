from flask import current_app as app
from superset.security import SupersetSecurityManager
import requests


class DviewCustomSecurityManager(SupersetSecurityManager):
    def auth_user_db(self, username, password):
        """Override to capture login credentials"""

        if bool(app.config.get("ENABLE_DVIEW")):
            dview_password = app.config.get("DEFAULT_PASSWORD_FOR_USER")
            # Get the user from database to access hashed password
            user = self.find_user(username=username)
            if user:
                cosmos_success = self.login_to_dview(user.email, user.password)

                # If cosmos login failed, don't proceed with normal auth
                if not cosmos_success:
                    return None

        return super().auth_user_db(username, password)

    def login_to_dview(self, username, plain_password):
        session = requests.Session()
        cosmos_url = app.config.get("COSMOS_ENDPOINT")
        if not cosmos_url:
            return False

        login_endpoint = f"{cosmos_url}/orchestrator/auth/email-login"
        headers = {
            "Content-Type": "application/json",
        }

        try:
            response = session.post(
                login_endpoint,
                json={"email": username, "pass": plain_password},
                headers=headers,
            )

            if response.status_code == 200:
                return True
            else:
                if bool(app.config.get("ENABLE_CHATBOT")) or bool(
                    app.config.get("ENABLE_DSENSE")
                ):
                    return False
                return True

        except requests.exceptions.RequestException as e:
            app.logger.error(f"COSMOS API error during login: {str(e)}")
            return False
