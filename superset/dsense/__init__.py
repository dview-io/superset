def flask_app_mutator(app):
    from flask import redirect, url_for
    from superset import appbuilder
    from .api import Dsense

    #
    # Setup API
    #
    appbuilder.add_api(Dsense)
   