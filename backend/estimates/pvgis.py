"""
Yield estimates from PVGIS, the EU Joint Research Centre's free PV
service, cached per 1 kWp. Browsers cannot call PVGIS directly because it
sends no CORS headers, so the backend asks on their behalf.
"""

from dataclasses import dataclass

import httpx

from buildings.geometry import pvgis_aspect
from estimates.models import PvgisResult

PVCALC_URL = "https://re.jrc.ec.europa.eu/api/v5_3/PVcalc"

# PVGIS's recommended default for losses in cables, inverter and dirt.
SYSTEM_LOSS_PCT = 14

TIMEOUT = httpx.Timeout(30.0, connect=10.0)


class PvgisUnavailable(Exception):
    pass


@dataclass(frozen=True)
class YieldPerKwp:
    annual_kwh: float
    monthly_kwh: tuple[float, ...]


def yield_per_kwp(lat: float, lon: float, tilt: float, azimuth: float) -> PvgisResult:
    """
    PVGIS rounds angles to whole degrees itself, so rounding first gives
    identical results with more cache hits. Locations are rounded to 0.001°
    (about 100 m), so all roof faces of a building share one location.
    """
    key = {
        "lat": round(lat, 3),
        "lon": round(lon, 3),
        "tilt": round(tilt),
        "aspect": round(pvgis_aspect(azimuth)),
    }
    cached = PvgisResult.objects.filter(**key).first()
    if cached:
        return cached
    fetched = fetch_yield_per_kwp(**key)
    result, _ = PvgisResult.objects.get_or_create(
        **key,
        defaults={
            "annual_kwh": fetched.annual_kwh,
            "monthly_kwh": list(fetched.monthly_kwh),
        },
    )
    return result


def fetch_yield_per_kwp(
    lat: float, lon: float, tilt: int, aspect: int, client: httpx.Client | None = None
) -> YieldPerKwp:
    params = {
        "lat": lat,
        "lon": lon,
        "peakpower": 1,
        "loss": SYSTEM_LOSS_PCT,
        "angle": tilt,
        "aspect": aspect,
        "outputformat": "json",
    }
    try:
        if client is None:
            with httpx.Client(timeout=TIMEOUT) as own_client:
                response = own_client.get(PVCALC_URL, params=params)
        else:
            response = client.get(PVCALC_URL, params=params)
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise PvgisUnavailable(f"PVGIS request failed: {error}") from error

    outputs = response.json()["outputs"]
    return YieldPerKwp(
        annual_kwh=outputs["totals"]["fixed"]["E_y"],
        monthly_kwh=tuple(month["E_m"] for month in outputs["monthly"]["fixed"]),
    )
