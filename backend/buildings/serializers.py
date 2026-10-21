import json

from django.contrib.gis.geos import GEOSGeometry
from rest_framework import serializers

from buildings.geometry import direction_label
from buildings.models import Building, Surface

# Baden-Württemberg's bounding box from OpenStreetMap (Nominatim) as
# [west, south, east, north]; the frontend's region.ts uses the same numbers.
BW_BBOX = (7.5117, 47.5324, 10.4956, 49.7913)


class LocationSerializer(serializers.Serializer):
    lon = serializers.FloatField()
    lat = serializers.FloatField()

    def validate(self, data):
        west, south, east, north = BW_BBOX
        if not (west <= data["lon"] <= east and south <= data["lat"] <= north):
            raise serializers.ValidationError("Location is outside Baden-Württemberg.")
        return data


class SurfaceSerializer(serializers.ModelSerializer):
    direction = serializers.SerializerMethodField()
    geometry = serializers.SerializerMethodField()

    class Meta:
        model = Surface
        fields = (
            "gml_id",
            "kind",
            "roof_type",
            "area",
            "tilt",
            "azimuth",
            "direction",
            "geometry",
        )

    def get_direction(self, surface: Surface) -> str | None:
        return None if surface.azimuth is None else direction_label(surface.azimuth)

    def get_geometry(self, surface: Surface) -> dict:
        return to_geojson(surface.geometry)


class BuildingSerializer(serializers.ModelSerializer):
    footprint = serializers.SerializerMethodField()
    surfaces = serializers.SerializerMethodField()

    class Meta:
        model = Building
        fields = (
            "gml_id",
            "name",
            "function",
            "measured_height",
            "street",
            "house_number",
            "locality",
            "footprint",
            "surfaces",
        )

    def get_footprint(self, building: Building) -> dict:
        return to_geojson(building.footprint)

    def get_surfaces(self, building: Building) -> list:
        surfaces = building.surfaces.order_by("kind", "-area")
        return SurfaceSerializer(surfaces, many=True).data


def to_geojson(geometry: GEOSGeometry) -> dict:
    return json.loads(geometry.transform(4326, clone=True).json)
