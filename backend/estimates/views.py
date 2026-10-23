from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from estimates.pvgis import PvgisUnavailable, yield_per_kwp
from estimates.serializers import EstimateQuerySerializer


@api_view(["GET"])
def estimate(request: Request) -> Response:
    """
    Yield for 1 kWp. It scales linearly with system size, so clients
    multiply by their own kWp instead of asking again for every size.
    """
    query = EstimateQuerySerializer(data=request.query_params)
    query.is_valid(raise_exception=True)
    params = query.validated_data
    try:
        result = yield_per_kwp(
            params["lat"], params["lon"], params["tilt"], params["azimuth"]
        )
    except PvgisUnavailable:
        return Response(
            {"detail": "The PVGIS yield service is not reachable. Try again later."},
            status=503,
        )
    return Response(
        {
            "annual_kwh_per_kwp": result.annual_kwh,
            "monthly_kwh_per_kwp": result.monthly_kwh,
        }
    )
