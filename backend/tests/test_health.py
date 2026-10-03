"""
Tests for ``GET /api/health``.
"""

from unittest import mock

import pytest
from django.db import OperationalError, connection


@pytest.mark.django_db
def test_health_reports_ok_with_postgis_version(client):
    """
    With a working database the endpoint answers 200 and names the
    PostGIS version, which proves the extension is installed.
    """
    response = client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["postgis"].startswith("3.")


def test_health_returns_503_when_database_is_unreachable(client):
    """
    A database outage is simulated by making every cursor call fail.
    The endpoint must answer 503 with an error body, not crash with 500.
    """
    with mock.patch.object(connection, "cursor", side_effect=OperationalError("down")):
        response = client.get("/api/health")

    assert response.status_code == 503
    assert response.json() == {"status": "error", "database": "unreachable"}
