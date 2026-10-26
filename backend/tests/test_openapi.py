from django.core.management import call_command


def test_api_description_is_valid_and_complete(tmp_path):
    """Fails on any view or field the schema generator can't describe."""
    call_command(
        "spectacular",
        "--validate",
        "--fail-on-warn",
        "--file",
        str(tmp_path / "schema.yaml"),
    )


def test_docs_page_loads_swagger_ui_from_this_server(client):
    response = client.get("/api/docs")

    assert response.status_code == 200
    assert b"/static/drf_spectacular_sidecar/swagger-ui-dist/" in response.content
