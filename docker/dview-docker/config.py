import os
from flask_caching.backends.rediscache import RedisCache
from superset.dsense import flask_app_mutator

# Redis Base URL
REDIS_BASE_URL = f"{os.getenv('REDIS_PROTO')}://{os.getenv('REDIS_HOST')}:{os.getenv('REDIS_PORT')}"

# Redis URL Params
REDIS_URL_PARAMS = ""

# Build Redis URLs
CACHE_REDIS_URL = f"{REDIS_BASE_URL}/{os.getenv('REDIS_DB')}{REDIS_URL_PARAMS}"
CELERY_REDIS_URL = f"{REDIS_BASE_URL}/{os.getenv('REDIS_CELERY_DB')}{REDIS_URL_PARAMS}"

MAPBOX_API_KEY = os.getenv('MAPBOX_API_KEY', '')
CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 300,
    'CACHE_KEY_PREFIX': 'superset_',
    'CACHE_REDIS_URL': CACHE_REDIS_URL,
}
DATA_CACHE_CONFIG = CACHE_CONFIG

SQLALCHEMY_DATABASE_URI = f"postgresql+psycopg2://{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
SQLALCHEMY_TRACK_MODIFICATIONS = True

class CeleryConfig:
    imports = ("superset.sql_lab", )
    broker_url = CELERY_REDIS_URL
    result_backend = CELERY_REDIS_URL

CELERY_CONFIG = CeleryConfig
RESULTS_BACKEND = RedisCache(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=os.getenv('REDIS_PORT', '6379'),
    key_prefix='superset_results',
)

# Overrides
# secret
# Generate your own secret key for encryption. Use `openssl rand -base64 42` to generate a good key
SECRET_KEY = 'F5+YwfWwIte7fOcxO8UbP5lhQVt78+8/DJ0VhVnYuiW0as3zpffWQRMg'

COSMOS_ENDPOINT = os.getenv('COSMOS_ENDPOINT')
DEFAULT_CATALOG = os.getenv('DEFAULT_CATALOG')
LOGIN_USERNAME = os.getenv('LOGIN_USERNAME')
LOGIN_PASSWORD = os.getenv('LOGIN_PASSWORD')
ENABLE_CHATBOT = os.getenv('ENABLE_CHATBOT')
CORTEX_INTERNAL_TOKEN = os.getenv('CORTEX_INTERNAL_TOKEN')

PROMPT_TEMPLATE="""You are a business executive reviewing strategic insights. 
Using the {catalog} dataset, analyze and interpret the results of the following SQL query: 
{sql} 
The core business question is: {prompt} 
Instructions — Your response must: 
    1. Identify and apply key performance indicators (KPIs) and other relevant business metrics based on the context of the tables using the SQL query. Ensure your analysis directly addresses the business question and supports actionable, data-driven decisions. 
    2. Deliver a concise executive summary focused on strategic insights. Use clear, business-oriented language suitable for senior decision-makers, avoiding technical or engineering terms. Present all monetary values in INR.
    3. Highlight key focus words by writing them in bold and all capital letters."""

FEATURE_FLAGS = {"ALERT_REPORTS": True,"CORTEX_ENPOINT":os.getenv('CORTEX_ENDPOINT'),
                 "COSMOS_ENDPOINT":COSMOS_ENDPOINT,

                 "DEFAULT_CATALOG":DEFAULT_CATALOG,

                 "LOGIN_USERNAME":LOGIN_USERNAME,
                 "LOGIN_PASSWORD":LOGIN_PASSWORD,
                 "ENABLE_CHATBOT":ENABLE_CHATBOT,
                 "CORTEX_INTERNAL_TOKEN":CORTEX_INTERNAL_TOKEN,"PROMPT_TEMPLATE":PROMPT_TEMPLATE}

FLASK_APP_MUTATOR = flask_app_mutator
