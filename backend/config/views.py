"""
Project-level API views that don't belong to any feature app.
"""

from django.db import DatabaseError, connection
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response


@extend_schema(
    summary="Health check",
    responses={
        200: inline_serializer(
            "Health",
            {"status": serializers.CharField(), "postgis": serializers.CharField()},
        ),
        503: inline_serializer(
            "HealthError",
            {"status": serializers.CharField(), "database": serializers.CharField()},
        ),
    },
)
@api_view(["GET"])
def health(request: Request) -> Response:
    """
    Report whether the API is up and can query PostGIS.

    One cheap query proves the whole chain works: Django, the database
    connection, and the PostGIS extension. A failure returns 503 (Service
    Unavailable) instead of crashing with 500, so callers such as the
    frontend indicator and Postman get a clear "not ready" answer.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT postgis_lib_version()")
            (postgis_version,) = cursor.fetchone()
    except DatabaseError:
        return Response({"status": "error", "database": "unreachable"}, status=503)
    return Response({"status": "ok", "postgis": postgis_version})
