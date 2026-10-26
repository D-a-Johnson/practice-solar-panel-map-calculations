"""
Parts of the OpenAPI description that the views of several apps share.
"""

from drf_spectacular.utils import OpenApiResponse
from rest_framework import serializers


class DetailSerializer(serializers.Serializer):
    detail = serializers.CharField()


def error(description: str) -> OpenApiResponse:
    return OpenApiResponse(DetailSerializer, description=description)


INVALID_QUERY = OpenApiResponse(
    description=(
        "A query parameter is missing or invalid, or the location is outside "
        "Baden-Württemberg. The body lists the messages per parameter."
    )
)
