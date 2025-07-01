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

# Overridesz
# secret
# Generate your own secret key for encryption. Use `openssl rand -base64 42` to generate a good key
SECRET_KEY = 'F5+YwfWwIte7fOcxO8UbP5lhQVt78+8/DJ0VhVnYuiW0as3zpffWQRMg'

COSMOS_ENDPOINT = os.getenv('COSMOS_ENDPOINT')
DEFAULT_CATALOG = os.getenv('DEFAULT_CATALOG')
LOGIN_USERNAME = os.getenv('LOGIN_USERNAME')
LOGIN_PASSWORD = os.getenv('LOGIN_PASSWORD')
ENABLE_CHATBOT = os.getenv('ENABLE_CHATBOT')
CORTEX_INTERNAL_TOKEN = os.getenv('CORTEX_INTERNAL_TOKEN')
DEFAULT_LABELIDS=["adhoc.__uploads__.loan_against_property"]
# DEFAULT_LABELIDS=["3a71e20a80d14a64b3cc31a49d8deaf6"]
ENABLE_DSENSE = True
DSENSE_URL='https://cloud-dev.dview.io/superset/loader'
RELATIONS_URL='https://cloud-dev.dview.io/superset/relations'

PROMPT_TEMPLATE="""{prompt}.  **INSTRUCTIONS:** 1. If the user refers to a **SPECIFIC MONTH**, compare with the **PREVIOUS AND NEXT MONTH** if available. 2. If the user refers to a **QUARTER**, compare with the **PREVIOUS QUARTER**. 3. If the user refers to a **YEAR**, compare with the **PREVIOUS YEAR**. 4. If a filter such as **PRODUCT**, **SCHEME**, **ZONE**, **CITY**, **STATE**, **LOCATION**, or **BRANCH** is used, compare that group against the **TOP 3 PEERS** in the same category using **DISBURSAL RATIO** or **DISBURSED VOLUME**. --- **METRIC LOGIC:** **DISBURSAL_RATIO_SQL**: > CASE WHEN COUNT(DISTINCT REFERENCE_ID_CLEANED) = 0 THEN 0 > ELSE ROUND(100.0 * SUM(CASE WHEN GT_FINAL = '10 Disbursed' THEN 1 ELSE 0 END) / COUNT(DISTINCT REFERENCE_ID_CLEANED), 1) END --- **RESPONSE FORMAT:** - All **KPI NAMES**, **TIME PERIODS**, and **FILTER VALUES** in **BOLD AND ALL CAPITAL LETTERS** - Monetary values in **INR**, 1 decimal place, using **CRORES** if applicable - Use directional terms like **INCREASE**, **DECLINE**, **ROSE**, **FELL**, **HIGHER**, **LOWER** - Always quantify: - **% POINT CHANGE IN DISBURSAL RATIO** - **% CHANGE IN DISBURSED VOLUME** --- **ENFORCEMENT:** - **DO NOT** ask the user to specify a comparison period. - **ALWAYS** infer the **ADJACENT PERIOD** based on available data in **GT_DATE**. - **DO NOT** include forward-looking statements unless explicitly requested. - **ALWAYS** include a **TREND-BASED RESPONSE** even if the user provides only one month. - **DO NOT** output in multiple rows. **ALWAYS** write SQL in a way that produces **ONE ROW** with each month or entity as a **COLUMN**. --- **FORMAT OVERRIDE (USE THIS STRICTLY FOR MONTH-BASED PROMPTS):** If the user is asking about **LOGIN TO DISBURSAL RATE** for a specific month, use the **exact format** below: ``` Login to Disbursal rate in [MONTH YEAR]: [X]% ([UP/DOWN] [Y]% from [PREVIOUS MONTH]) Disbursed volume: [VOLUME], compared to [PREVIOUS MONTH VOLUME] ([UP/DOWN] Y%) — [COMMENT] ``` --- **RULES FOR THIS FORMAT:** - Only compare to the **PREVIOUS MONTH**, not both sides. - Round all **PERCENTAGE VALUES** to **1 DECIMAL PLACE**. - Select [COMMENT] based on data trend: - If % drop > 1% and **DISBURSED VOLUME** also fell → "MAJOR HIT AT CREDIT REJECTIONS." - If % rise < 1% → "SLIGHT IMPROVEMENT DUE TO BETTER APPROVAL RATE." - If % rise > 1% and volume also rose → "IMPROVED APPROVALS AND SOURCING EFFICIENCY." - **DO NOT** explain what **DISBURSAL RATIO** is. - **DO NOT** repeat metric logic or definitions. - **DO NOT** output in any narrative or multiline format. - **DO NOT** return raw tables or datasets. - The final **OUTPUT** must follow this exact one-liner structure with **KEYWORDS IN BOLD AND ALL CAPS** (e.g., **MARCH 2025**, **10.3%**, **DOWN**, **DISBURSED VOLUME**, etc.). --- **ADDITIONAL ENFORCEMENT RULE:** - **ALWAYS** calculate and insert the actual **% CHANGE IN DISBURSED VOLUME**. - **DO NOT** use placeholders like "Y%" — if data is missing, return this fallback: "Disbursed volume data unavailable for [PREVIOUS MONTH]." - **NEVER** return incomplete statements or ambiguous phrases like "DOWN Y%" or "UP Y%"."""

FEATURE_FLAGS = {"ALERT_REPORTS": True,
                 "CORTEX_ENPOINT":os.getenv('CORTEX_ENDPOINT'),
                 "COSMOS_ENDPOINT":COSMOS_ENDPOINT,
                 "LOGIN_USERNAME":LOGIN_USERNAME,
                 "LOGIN_PASSWORD":LOGIN_PASSWORD,
                 "ENABLE_CHATBOT":ENABLE_CHATBOT,
                 "CORTEX_INTERNAL_TOKEN":CORTEX_INTERNAL_TOKEN,
                 "PROMPT_TEMPLATE":PROMPT_TEMPLATE ,
                 "DEFAULT_LABELIDS":DEFAULT_LABELIDS,
                 "ENABLE_DSENSE":ENABLE_DSENSE,
                 "DSENSE_URL":DSENSE_URL,
                 "RELATIONS_URL":RELATIONS_URL}

FLASK_APP_MUTATOR = flask_app_mutator