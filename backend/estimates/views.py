from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from config.schema import INVALID_QUERY, error
from estimates.models import Assumption
from estimates.pvgis import PvgisUnavailable, yield_per_kwp
from estimates.serializers import (
    AssumptionSerializer,
    AssumptionsSerializer,
    EstimateQuerySerializer,
    YieldPerKwpSerializer,
)


@extend_schema(
    summary="Yield per kWp",
    parameters=[EstimateQuerySerializer],
    responses={
        200: YieldPerKwpSerializer,
        400: INVALID_QUERY,
        503: error("The PVGIS yield service is not reachable."),
    },
)
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
    return Response(YieldPerKwpSerializer(result).data)


@extend_schema(
    summary="Assumptions for savings and payback",
    responses=AssumptionsSerializer,
)
@api_view(["GET"])
def assumptions(request: Request) -> Response:
    """
    Default values for the economics, keyed by name (for example
    ``electricity_price``), each with its source. Editable in the Django
    admin.
    """
    return Response(
        {
            assumption.key: AssumptionSerializer(assumption).data
            for assumption in Assumption.objects.order_by("key")
        }
    )
