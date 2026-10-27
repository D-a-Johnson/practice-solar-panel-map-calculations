"""
Turns a downloaded LoD2 tile into Building and Roof rows.

A tile is imported in one transaction and replaces any earlier import of
the same tile, so a failed import leaves nothing half-written behind.
"""

from collections.abc import Iterable
from dataclasses import dataclass
from functools import reduce
from itertools import batched
from pathlib import Path

from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from django.db import connection, transaction

from buildings.geometry import area, orientation
from buildings.lod2_parser import Address, ParsedBuilding, ParsedSurface, iter_buildings
from buildings.models import Building, Roof, Tile
from buildings.tiles import TileId, download_tile

# A face below this size cannot hold even one solar module (a standard one
# is about 1.7 m²), and LoD2 contains many slivers of 0–1 m².
MIN_SURFACE_AREA_M2 = 1.0
BATCH_SIZE = 1000


@dataclass(frozen=True)
class ImportResult:
    tile: str
    buildings: int
    roofs: int
    skipped_existing: int


def import_tile(tile_id: TileId, cache_dir: Path) -> ImportResult:
    """Imports a tile, replacing any earlier import of it."""
    zip_path = download_tile(tile_id, cache_dir)
    with transaction.atomic():
        _lock(tile_id)
        return _replace_tile(tile_id, zip_path)


def import_tile_if_missing(tile_id: TileId, cache_dir: Path) -> None:
    """
    For lookups, where another request may be importing the same tile right
    now: whoever waited for the lock finds the tile there and skips it.
    """
    zip_path = download_tile(tile_id, cache_dir)
    with transaction.atomic():
        _lock(tile_id)
        if not Tile.objects.filter(id=str(tile_id)).exists():
            _replace_tile(tile_id, zip_path)


def _lock(tile_id: TileId) -> None:
    """
    Makes imports of the same tile wait for each other, across all processes
    (gunicorn workers, import commands), until the transaction ends. The
    download happens before, so a slow LGL server never holds the lock or a
    database transaction.
    """
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT pg_advisory_xact_lock(%s, %s)",
            [tile_id.east_km, tile_id.north_km],
        )


def _replace_tile(tile_id: TileId, zip_path: Path) -> ImportResult:
    buildings = roofs = skipped = 0
    Tile.objects.filter(id=str(tile_id)).delete()
    tile = Tile.objects.create(id=str(tile_id))
    for batch in batched(iter_buildings(zip_path), BATCH_SIZE, strict=False):
        saved, saved_roofs, existing = _save_batch(tile, batch)
        buildings += saved
        roofs += saved_roofs
        skipped += existing
    return ImportResult(str(tile_id), buildings, roofs, skipped)


def _save_batch(tile: Tile, batch: Iterable[ParsedBuilding]) -> tuple[int, int, int]:
    """
    Buildings on a tile border can, in principle, also appear in the
    neighbouring tile; those already stored are skipped instead of breaking
    the unique gml_id constraint.
    """
    parsed = list(batch)
    existing = set(
        Building.objects.filter(gml_id__in=[p.gml_id for p in parsed]).values_list(
            "gml_id", flat=True
        )
    )
    new = [p for p in parsed if p.gml_id not in existing]
    rows = Building.objects.bulk_create([_building_row(tile, p) for p in new])
    roof_rows = [
        roof
        for row, building in zip(rows, new, strict=True)
        for roof in _roof_rows(row, building.surfaces)
    ]
    Roof.objects.bulk_create(roof_rows)
    return len(rows), len(roof_rows), len(existing)


def _building_row(tile: Tile, parsed: ParsedBuilding) -> Building:
    address = _main_address(parsed.addresses)
    return Building(
        gml_id=parsed.gml_id,
        tile=tile,
        name=parsed.name or "",
        function=parsed.function or "",
        measured_height=parsed.measured_height,
        street=(address and address.street) or "",
        house_number=(address and address.house_number) or "",
        locality=(address and address.locality) or "",
        footprint=_footprint([s for s in parsed.surfaces if s.kind == "ground"]),
    )


def _roof_rows(building: Building, parsed: Iterable[ParsedSurface]) -> list[Roof]:
    rows = []
    for surface in parsed:
        if surface.kind != "roof":
            continue
        face_area = area(surface.exterior, surface.holes)
        if face_area < MIN_SURFACE_AREA_M2:
            continue
        facing = orientation(surface.exterior, facing_up=True)
        rows.append(
            Roof(
                building=building,
                gml_id=surface.gml_id,
                roof_type=surface.roof_type or "",
                geometry=Polygon(surface.exterior, *surface.holes, srid=25832),
                area=face_area,
                tilt=facing.tilt,
                azimuth=facing.azimuth,
            )
        )
    return rows


def _main_address(addresses: tuple[Address, ...]) -> Address | None:
    return next(
        (a for a in addresses if a.house_number), addresses[0] if addresses else None
    )


def _footprint(grounds: list[ParsedSurface]) -> MultiPolygon:
    """
    The union of all ground polygons in 2D. A few LoD2 ground rings intersect
    themselves (3 of 10,449 in tile 413_5316); make_valid() repairs them,
    because PostGIS only defines point-in-polygon tests for valid geometries.
    """
    polygons = [
        Polygon(
            _flat(g.exterior), *(_flat(h) for h in g.holes), srid=25832
        ).make_valid()
        for g in grounds
    ]
    return _as_multipolygon(reduce(lambda a, b: a.union(b), polygons))


def _flat(ring):
    return [(x, y) for x, y, _ in ring]


def _as_multipolygon(geometry: GEOSGeometry) -> MultiPolygon:
    if isinstance(geometry, MultiPolygon):
        return geometry
    if isinstance(geometry, Polygon):
        return MultiPolygon(geometry, srid=geometry.srid)
    parts = [g for g in geometry if isinstance(g, Polygon)] + [
        p for g in geometry if isinstance(g, MultiPolygon) for p in g
    ]
    return MultiPolygon(*parts, srid=geometry.srid)
