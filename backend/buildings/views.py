from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from buildings.lookup import building_at
from buildings.serializers import BuildingSerializer, LocationSerializer
from buildings.tiles import TileDownloadFailed, TileNotAvailable


@api_view(["GET"])
def building_at_location(request: Request) -> Response:
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
