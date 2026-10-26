from drf_spectacular.utils import extend_schema
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from buildings.lookup import building_at
from buildings.serializers import BuildingSerializer, LocationSerializer
from buildings.tiles import TileDownloadFailed, TileNotAvailable
from config.schema import INVALID_QUERY, error


@extend_schema(
    summary="Building at a location",
    parameters=[LocationSerializer],
    responses={
        200: BuildingSerializer,
        400: INVALID_QUERY,
        404: error("No LoD2 data, or no building, at this location."),
        503: error("The LGL download service is not reachable."),
    },
)
@api_view(["GET"])
def building_at_location(request: Request) -> Response:
    """
    The building under the point, or the nearest one within 5 m, with its
    roof faces and walls. The first request in a new area downloads and
    imports an LGL tile, which takes about 10 seconds.
    """
    query = LocationSerializer(data=request.query_params)
    query.is_valid(raise_exception=True)
    try:
        building = building_at(**query.validated_data)
    except TileNotAvailable:
        return Response({"detail": "No LoD2 data for this location."}, status=404)
    except TileDownloadFailed:
        return Response(
            {"detail": "The LGL download service is not reachable. Try again later."},
            status=503,
        )
    if building is None:
        return Response({"detail": "No building at this location."}, status=404)
    return Response(BuildingSerializer(building).data)
