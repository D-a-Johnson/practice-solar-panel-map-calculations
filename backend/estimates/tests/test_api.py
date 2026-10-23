import pytest

from estimates import pvgis
from estimates.pvgis import PvgisUnavailable, YieldPerKwp

URL = "/api/estimates"
WEST_ROOF = {
    "lat": 47.9945,
    "lon": 7.84346,
    "tilt": 39.3,
    "azimuth": 280.1,
    "peak_power_kwp": 4.4,
}
MONTHLY = (20, 35, 60, 80, 95, 100, 105, 95, 70, 50, 25, 15)


@pytest.fixture
def fake_pvgis(monkeypatch):
    calls = []

    def fake(lat, lon, tilt, aspect):
        calls.append((lat, lon, tilt, aspect))
        return YieldPerKwp(annual_kwh=sum(MONTHLY), monthly_kwh=MONTHLY)

    monkeypatch.setattr(pvgis, "fetch_yield_per_kwp", fake)
    return calls


@pytest.mark.django_db
def test_scales_the_one_kwp_yield_to_the_system_size(client, fake_pvgis):
    body = client.get(URL, WEST_ROOF).json()

    assert body["specific_yield_kwh_per_kwp"] == pytest.approx(750)
    assert body["annual_kwh"] == pytest.approx(750 * 4.4)
    assert body["monthly_kwh"][6] == pytest.approx(105 * 4.4)


@pytest.mark.django_db
def test_asks_pvgis_with_rounded_inputs_and_south_based_aspect(client, fake_pvgis):
    client.get(URL, WEST_ROOF)
    assert fake_pvgis == [(47.995, 7.843, 39, 100)]


@pytest.mark.django_db
def test_nearby_requests_reuse_the_cached_result(client, fake_pvgis):
    client.get(URL, WEST_ROOF)
    client.get(URL, {**WEST_ROOF, "tilt": 39.4, "lat": 47.99452, "peak_power_kwp": 10})
    assert len(fake_pvgis) == 1


@pytest.mark.django_db
def test_pvgis_outage_answers_503(client, monkeypatch):
    def down(lat, lon, tilt, aspect):
        raise PvgisUnavailable("down")

    monkeypatch.setattr(pvgis, "fetch_yield_per_kwp", down)
    assert client.get(URL, WEST_ROOF).status_code == 503


@pytest.mark.parametrize(
    "change",
    [{"tilt": 95}, {"azimuth": -1}, {"peak_power_kwp": 0}, {"lon": 2.35, "lat": 48.86}],
)
def test_invalid_inputs_are_rejected(client, change):
    assert client.get(URL, {**WEST_ROOF, **change}).status_code == 400
