from django.conf import settings
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db import transaction
from django.db.models import Q

from buildings.importer import import_tile, lock_tile
from buildings.models import Building, Tile
from buildings.tiles import (
    TileDownloadFailed,
    TileId,
    TileNotAvailable,
    tile_for_utm,
    tiles_near,
)

# Clicks up to this far outside an LoD2 footprint still count. The map draws
# OpenStreetMap outlines, which don't match LoD2 exactly, so a click on a
# drawn edge can land just outside. The value is a judgement call, not measured.
SNAP_DISTANCE_M = 5.0

# Clickable objects extend past the tile LGL assigns them to by up to 45 m
# (measured in tile 413_5316).
NEIGHBOUR_MARGIN_M = 50.0

# LoD2 also contains walls, bridges, chimneys and tanks (function codes
# 5xxxx). Only buildings (31001_*) and canopies such as carports, which can
# carry solar panels, can be selected.
CLICKABLE = Q(function__startswith="31001_") | Q(function="51009_1610")


def building_at(lon: float, lat: float) -> Building | None:
    point = Point(lon, lat, srid=4326)
    point.transform(25832)
    _ensure_imported(tile_for_utm(point.x, point.y))
    building = _nearest(point)
    if building is None:
        for tile in tiles_near(point.x, point.y, NEIGHBOUR_MARGIN_M):
            try:
                _ensure_imported(tile)
            except TileNotAvailable, TileDownloadFailed:
                continue
        building = _nearest(point)
    return building


def _ensure_imported(tile: TileId) -> None:
    if Tile.objects.filter(id=str(tile)).exists():
        return
    with transaction.atomic():
        lock_tile(tile)
        # Another request may have imported the tile while this one waited.
        if not Tile.objects.filter(id=str(tile)).exists():
            import_tile(tile, settings.LOD2_CACHE_DIR)


def _nearest(point: Point) -> Building | None:
    return (
        Building.objects.filter(
            CLICKABLE, footprint__dwithin=(point, D(m=SNAP_DISTANCE_M))
        )
        .annotate(distance=Distance("footprint", point))
        .order_by("distance")
        .first()
    )
