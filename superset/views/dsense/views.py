from flask_appbuilder import BaseView, expose
from flask import jsonify
from flask_appbuilder.security.decorators import has_access
from superset.views.base import (
    BaseSupersetView,
)


class DsenseApi(BaseSupersetView):
    route_base = "/dsense"

    @expose("", methods=["GET"])
    @has_access
    def get_data(self):
        return super().render_app_template()


class RelationsApi(BaseSupersetView):
    route_base = "/relations"

    @expose("", methods=["GET"])
    @has_access
    def get_data(self):
        return super().render_app_template()


class PipelinesApi(BaseSupersetView):
    route_base = "/pipelines"

    @expose("", methods=["GET"])
    @has_access
    def get_data(self):
        return super().render_app_template()


class WorkflowApi(BaseSupersetView):
    route_base = "/workflows"

    @expose("", methods=["GET"])
    @has_access
    def get_data(self):
        return super().render_app_template()


class DagsApi(BaseSupersetView):
    route_base = "/dags"

    @expose("", methods=["GET"])
    @has_access
    def get_data(self):
        return super().render_app_template()


class PolicyApi(BaseSupersetView):
    route_base = "/policy"

    @expose("", methods=["GET"])
    @has_access
    def get_data(self):
        return super().render_app_template()
