"""
Project-level API views that don't belong to any feature app.
"""

from django.db import DatabaseError, connection
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response


@api_view(["GET"])
def health(request: Request) -> Response:
    """
    Report whether the API is up and can query PostGIS.

    One cheap query proves the whole chain works: Django, the database
    connection, and the PostGIS extension. A failure returns 503 (Service
    Unavailable) instead of crashing with 500, so callers such as the
    frontend indicator, Postman and later the Azure health probe get a
    clear "not ready" answer.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT postgis_lib_version()")
            (postgis_version,) = cursor.fetchone()
    except DatabaseError:
        return Response({"status": "error", "database": "unreachable"}, status=503)
    return Response({"status": "ok", "postgis": postgis_version})
