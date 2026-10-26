import json

from django.contrib.gis.db.models.functions import AsGeoJSON, Transform
from django.contrib.gis.gdal import CoordTransform, SpatialReference
from django.contrib.gis.geos import LineString
from rest_framework import serializers

from buildings.facades import facades
from buildings.geometry import direction_label
from buildings.models import Building, Surface

# Baden-Württemberg's bounding box from OpenStreetMap (Nominatim) as
# [west, south, east, north]; the frontend's region.ts uses the same numbers.
BW_BBOX = (7.5117, 47.5324, 10.4956, 49.7913)

# Seven decimals of a degree are about 1 cm: plenty for drawing on a map,
# and a quarter smaller than full precision.
GEOJSON_DECIMALS = 7

# LoD2 walls are vertical (see facades.py).
WALL_TILT = 90.0


def wgs84_geojson(field: str) -> AsGeoJSON:
    return AsGeoJSON(Transform(field, 4326), precision=GEOJSON_DECIMALS)


class LocationSerializer(serializers.Serializer):
    lon = serializers.FloatField()
    lat = serializers.FloatField()

    def validate(self, data):
        west, south, east, north = BW_BBOX
        if not (west <= data["lon"] <= east and south <= data["lat"] <= north):
            raise serializers.ValidationError("Location is outside Baden-Württemberg.")
        return data


class SurfaceSerializer(serializers.ModelSerializer):
    """Expects surfaces annotated with `geojson` (see BuildingSerializer)."""

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
        return json.loads(surface.geojson)


class BuildingSerializer(serializers.ModelSerializer):
    """
    Geometries are converted to GeoJSON by PostGIS in the same query that
    loads them: 2 ms instead of 112 ms in Python for the Minster's 140 roof
    faces.
    """

    footprint = serializers.SerializerMethodField()
    surfaces = serializers.SerializerMethodField()
    walls = serializers.SerializerMethodField()

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
            "walls",
        )

    def get_footprint(self, building: Building) -> dict:
        footprint = (
            Building.objects.filter(pk=building.pk)
            .annotate(geojson=wgs84_geojson("footprint"))
            .values_list("geojson", flat=True)
            .get()
        )
        return json.loads(footprint)

    def get_surfaces(self, building: Building) -> list:
        surfaces = building.surfaces.order_by("-area").annotate(
            geojson=wgs84_geojson("geometry")
        )
        return SurfaceSerializer(surfaces, many=True).data

    def get_walls(self, building: Building) -> list:
        to_wgs84 = CoordTransform(
            SpatialReference(building.footprint.srid), SpatialReference(4326)
        )
        walls = []
        for number, facade in enumerate(facades(building.footprint), start=1):
            line = LineString(facade.start, facade.end, srid=building.footprint.srid)
            line.transform(to_wgs84)
            walls.append(
                {
                    "id": f"wall-{number}",
                    "kind": "wall",
                    "tilt": WALL_TILT,
                    "azimuth": facade.azimuth,
                    "direction": direction_label(facade.azimuth),
                    "width": facade.width,
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [round(lon, GEOJSON_DECIMALS), round(lat, GEOJSON_DECIMALS)]
                            for lon, lat in line.coords
                        ],
                    },
                }
            )
        return walls
