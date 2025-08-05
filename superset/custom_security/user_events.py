from sqlalchemy import event
from flask import current_app as app
from flask_appbuilder.security.sqla.models import User
import requests

def setup_user_hooks():
    @event.listens_for(User, 'after_insert')
    def user_created(mapper, connection, target):
        cosmos_url = app.config.get("COSMOS_ENDPOINT") 
        email_id=target.email
        org="dview"
        # print(check_password_hash(target.password, "demo@123"))
        print(f"🆕 New user created: {target.username}{target.password}")

        # session = requests.Session()
        # if not cosmos_url:
        #     return False

        # user_upadate_endpoint = f"{cosmos_url}/orchestrator/auth/register?email={email_id}&org={org}&encrpyt=true"
        # headers = {
        #     "Content-Type": "application/json",
        # }
        # try:      
        #     response = session.post(
        #         user_upadate_endpoint,
        #         json={"email": target.email, "password": target.password,"designation":'SDE',""},
        #         headers=headers,
        #     )
    
        #     if response.status_code == 200:
        #         return True
        # except requests.exceptions.RequestException as e:
        #     app.logger.error(f"COSMOS API error during User creation: {str(e)}")
        #     return False

        # cosmos_url = app.config.get("COSMOS_ENDPOINT")
        # email_id = target.email
        # org = "dview"

        # app.logger.info(f"⏳ Attempting to register user in Cosmos before insert: {target.username}")
        
        # if not cosmos_url:
        #     raise Exception("COSMOS_ENDPOINT is not configured")

        # user_register_endpoint = f"{cosmos_url}/orchestrator/auth/register?email={email_id}&org={org}"
        # headers = {
        #     "Content-Type": "application/json",
        # }

        # try:
        #     response = requests.post(
        #         user_register_endpoint,
        #         json={
        #             "email": target.email,
        #             "password": "demo@123",
        #             "designation": "SDE",
        #             "phone": "",
        #             "purpose": "superset"
        #         },
        #         headers=headers,
        #         timeout=5,
        #     )

        #     if response.status_code != 200:
        #         msg = f"❌ Cosmos registration failed: {response.status_code} - {response.text}"
        #         app.logger.error(msg)
        #         raise Exception(msg)

        #     app.logger.info("✅ Cosmos registration successful. Proceeding with user insert.")

        # except requests.exceptions.RequestException as e:
        #     msg = f"❌ Cosmos API call failed: {str(e)}"
        #     app.logger.error(msg)
        #     raise Exception(msg)


    
    @event.listens_for(User, 'after_update')
    def user_updated(mapper, connection, target):
        print(f"[USER UPDATED] {target.username}")
        print(f"New hashed password: {target.password}")

    @event.listens_for(User, 'after_delete')
    def user_deleted(mapper, connection, target):
        print(f"[USER DELETED] Username: {target.username}, Email: {target.email}")


