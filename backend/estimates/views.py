from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from estimates.pvgis import PvgisUnavailable, yield_per_kwp
from estimates.serializers import EstimateQuerySerializer


@api_view(["GET"])
def estimate(request: Request) -> Response:
    query = EstimateQuerySerializer(data=request.query_params)
    query.is_valid(raise_exception=True)
    params = query.validated_data
    try:
        per_kwp = yield_per_kwp(
            params["lat"], params["lon"], params["tilt"], params["azimuth"]
        )
    except PvgisUnavailable:
        return Response(
            {"detail": "The PVGIS yield service is not reachable. Try again later."},
            status=503,
        )
    kwp = params["peak_power_kwp"]
    return Response(
        {
            "peak_power_kwp": kwp,
            "annual_kwh": per_kwp.annual_kwh * kwp,
            "monthly_kwh": [month * kwp for month in per_kwp.monthly_kwh],
            "specific_yield_kwh_per_kwp": per_kwp.annual_kwh,
        }
    )
