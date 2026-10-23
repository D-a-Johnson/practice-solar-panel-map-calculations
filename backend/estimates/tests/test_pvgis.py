import json
from pathlib import Path

import httpx
import pytest

from estimates.pvgis import PvgisUnavailable, fetch_yield_per_kwp

# Real PVGIS 5.3 answer (PVGIS © European Union) for the west roof of
# Moltkestraße 18, Freiburg (1 kWp, tilt 39°, aspect 100), trimmed to the
# fields the client reads.
RESPONSE = json.loads(
    (
        Path(__file__).parent / "fixtures" / "pvgis_moltkestrasse_west_1kwp.json"
    ).read_text()
)


def client_answering(status, body=None, requests=None):
    def handler(request):
        if requests is not None:
            requests.append(request)
        return httpx.Response(status, json=body)

    return httpx.Client(transport=httpx.MockTransport(handler))


def test_reads_annual_and_monthly_yield():
    result = fetch_yield_per_kwp(
        47.995, 7.843, 39, 100, client_answering(200, RESPONSE)
    )
    assert result.annual_kwh == pytest.approx(803.76)
    assert len(result.monthly_kwh) == 12
    assert result.monthly_kwh[0] == pytest.approx(21.46)
    assert sum(result.monthly_kwh) == pytest.approx(result.annual_kwh, abs=0.5)


def test_asks_for_one_kwp_with_the_given_orientation():
    requests = []
    fetch_yield_per_kwp(
        47.995, 7.843, 39, 100, client_answering(200, RESPONSE, requests)
    )
    params = requests[0].url.params
    assert (params["angle"], params["aspect"], params["peakpower"]) == (
        "39",
        "100",
        "1",
    )
    assert (params["loss"], params["outputformat"]) == ("14", "json")


@pytest.mark.parametrize("status", [400, 503])
def test_error_answers_raise_unavailable(status):
    with pytest.raises(PvgisUnavailable):
        fetch_yield_per_kwp(
            47.995, 7.843, 39, 100, client_answering(status, {"message": "x"})
        )


def test_unreachable_server_raises_unavailable():
    def handler(request):
        raise httpx.ConnectTimeout("timed out", request=request)

    client = httpx.Client(transport=httpx.MockTransport(handler))
    with pytest.raises(PvgisUnavailable):
        fetch_yield_per_kwp(47.995, 7.843, 39, 100, client)
