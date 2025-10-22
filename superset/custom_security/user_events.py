from sqlalchemy import event
from flask import current_app as app
from flask_appbuilder.security.sqla.models import User
import requests
from superset.custom_security.utils_file import get_org_info

headers = {
    "Content-Type": "application/json",
}


def setup_user_hooks():
    @event.listens_for(User, "after_insert")
    def user_created(mapper, connection, target):

        cosmos_url = app.config.get("COSMOS_ENDPOINT")
        user_password = app.config.get("DEFAULT_PASSWORD_FOR_USER")

        email_id = target.email
        orgName = get_org_info(email_id)
        print(
            f"New user created: {target.username}{target.password}{target.first_name}{orgName}"
        )

        session = requests.Session()
        if not cosmos_url:
            return False

        try:
            user_register_endpoint = f"{cosmos_url}/orchestrator/auth/register?email={email_id}&org={orgName}"

            response = session.post(
                user_register_endpoint,
                json={
                    "email": target.email,
                    "password": user_password,
                    "designation": "SDE",
                    "phone": "123456789",
                    "purpose": "Superset",
                    "name": target.first_name,
                },
                headers=headers,
            )

            if response.status_code != 200:
                msg = f"Cosmos registration failed: {response.status_code} - {response.text}"
                app.logger.error(msg)
                raise Exception(msg)

            app.logger.info(
                "Cosmos registration successful. Proceeding with user insert."
            )

            # calling user list api
            get_user_list_endpoint = (
                f"{cosmos_url}/orchestrator/auth/users?email={email_id}&org={orgName}"
            )

            user_list_response = session.get(
                get_user_list_endpoint,
                headers=headers,
            )
            if user_list_response.status_code != 200:
                msg = f"Cosmos get user list failed: {user_list_response.status_code} - {user_list_response.text}"
                app.logger.error(msg)
                raise Exception(msg)
            app.logger.info("Cosmos List successful. Proceeding with user insert.")

            matched_user = [
                user
                for user in user_list_response.json()
                if user["emailAddress"] == email_id
            ]

            if len(matched_user) > 0:
                payload_for_user_update = {
                    "id": matched_user[0]["id"],
                    "name": email_id,
                    "firstName": target.first_name,
                    "lastName": target.last_name,
                    "emailAddress": email_id,
                    "description": matched_user[0]["description"],
                    "groupIdList": matched_user[0]["groupIdList"],
                    "groupNameList": matched_user[0]["groupNameList"],
                    "status": matched_user[0]["status"],
                    "isVisible": matched_user[0]["isVisible"],
                    "userSource": matched_user[0]["userSource"],
                    "userRoleList": ["Admin"],
                }
                update_user_role_endpoint = f"{cosmos_url}/orchestrator/auth/{orgName}/user?email={email_id}&org={orgName}"

                update_role_response = session.put(
                    update_user_role_endpoint,
                    json=payload_for_user_update,
                    headers=headers,
                )

                if (
                    update_role_response.status_code != 200
                    and update_role_response.text != "true"
                ):
                    msg = f"Cosmos role update failed: {update_role_response.status_code} - {update_role_response.text}"
                    app.logger.error(msg)
                    raise Exception(msg)
                app.logger.info(
                    "Cosmos update user to Admin successful. Proceeding with user update."
                )

        except requests.exceptions.RequestException as e:
            app.logger.error(f"COSMOS API error during User creation: {str(e)}")
            return False

    @event.listens_for(User, "after_update")
    def user_updated(mapper, connection, target):
        cosmos_url = app.config.get("COSMOS_ENDPOINT")
        user_password = app.config.get("DEFAULT_PASSWORD_FOR_USER")
        session = requests.Session()
        email_id = target.email
        orgName = get_org_info(email_id)
        if not cosmos_url:
            return False

        user_update_endpoint = f"{cosmos_url}/orchestrator/apollo/auth/update-user?email={email_id}&org={orgName}"

        login_endpoint = f"{cosmos_url}/orchestrator/auth/email-login"
        try:
            response1 = session.post(
                login_endpoint,
                json={
                    "email": target.email,
                    "pass": app.config.get("DEFAULT_PASSWORD_FOR_USER"),
                },
                headers=headers,
            )
            if response1.status_code != 200:
                msg = f"Cosmos Login failed: {response1.status_code} - {response1.text}"
                app.logger.error(msg)
                raise Exception(msg)

            response = session.post(
                user_update_endpoint,
                json={
                    "email": target.email,
                    "password": user_password,
                    "designation": "SDE",
                    "phone": "123456789",
                    "purpose": "Superset",
                    "name": target.first_name,
                },
                headers=headers,
            )

            if response.status_code != 200:
                msg = f"Cosmos registration failed: {response.status_code} - {response.text}"
                app.logger.error(msg)
                raise Exception(msg)

            app.logger.info(
                "Cosmos update user successful. Proceeding with user update."
            )
        except requests.exceptions.RequestException as e:
            app.logger.error(f"COSMOS API error during User creation: {str(e)}")
            return False

    @event.listens_for(User, "after_delete")
    def user_deleted(mapper, connection, target):
        cosmos_url = app.config.get("COSMOS_ENDPOINT")

        email_id = target.email
        orgName = get_org_info(email_id)
        session = requests.Session()

        try:
            get_user_list_endpoint = (
                f"{cosmos_url}/orchestrator/auth/users?email={email_id}&org={orgName}"
            )

            user_list_response = session.get(
                get_user_list_endpoint,
                headers=headers,
            )
            if user_list_response.status_code != 200:
                msg = f"Cosmos get user list failed: {user_list_response.status_code} - {user_list_response.text}"
                app.logger.error(msg)
                raise Exception(msg)
            app.logger.info(
                "Cosmos get user list  successful. Proceeding with user delete."
            )

            matched_user = [
                user
                for user in user_list_response.json()
                if user["emailAddress"] == email_id
            ]
            if len(matched_user) > 0:
                user_delete_endpoint = f"{cosmos_url}/orchestrator/auth/dview/user?id={matched_user[0]['id']}&email={email_id}&org={orgName}"
                user_delete_response = session.delete(
                    user_delete_endpoint,
                    headers=headers,
                )
                if user_delete_response.status_code != 200:
                    msg = f"Cosmos get user list failed: {user_delete_response.status_code} - {user_delete_response.text}"
                    app.logger.error(msg)
                    raise Exception(msg)

            else:
                msg = f"User doesn't exist in cosmos."
                app.logger.error(msg)
                raise Exception(msg)

        except requests.exceptions.RequestException as e:
            app.logger.error(f"COSMOS API error during User deletion: {str(e)}")
            return False
