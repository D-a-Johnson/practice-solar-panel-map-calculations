import zipfile
from pathlib import Path

import pytest
from django.contrib.gis.geos import GeometryCollection, LineString, Point, Polygon

from buildings.importer import MIN_SURFACE_AREA_M2, _as_multipolygon, import_tile
from buildings.models import Building, Roof, Tile
from buildings.tiles import TileId

FIXTURE = Path(__file__).parent / "fixtures" / "freiburg_two_buildings.gml"
TILE = TileId(413, 5316)


@pytest.fixture
def cache_dir(tmp_path):
    with zipfile.ZipFile(tmp_path / TILE.zip_name, "w") as archive:
        archive.write(FIXTURE, "tile/LoD2_32_413_5316_1_BW.gml")
    return tmp_path


@pytest.mark.django_db
def test_import_stores_buildings_with_address_and_footprint(cache_dir):
    result = import_tile(TILE, cache_dir)

    assert (result.buildings, result.skipped_existing) == (2, 0)
    house = Building.objects.get(gml_id="DEBW_0010007TuWn")
    assert (house.street, house.house_number) == ("Moltkestraße", "18")
    assert house.footprint.area == pytest.approx(94.1, abs=0.05)
    assert Tile.objects.filter(id="413_5316").exists()


@pytest.mark.django_db
def test_building_parts_share_one_footprint(cache_dir):
    import_tile(TILE, cache_dir)
    house = Building.objects.get(gml_id="DEBW_0010007Tw9I")
    assert house.footprint.valid
    assert house.measured_height == pytest.approx(15.343)


@pytest.mark.django_db
def test_roofs_are_stored_with_precomputed_orientation(cache_dir):
    import_tile(TILE, cache_dir)

    house = Roof.objects.filter(building__gml_id="DEBW_0010007TuWn")
    roofs = sorted(house, key=lambda r: r.azimuth)
    assert [round(r.azimuth, 1) for r in roofs] == [100.1, 280.1]
    assert all(r.roof_type == "3100" for r in roofs)
    assert roofs[0].geometry.hasz
    assert not Roof.objects.filter(area__lt=MIN_SURFACE_AREA_M2).exists()


@pytest.mark.django_db
def test_point_in_footprint_finds_the_building(cache_dir):
    import_tile(TILE, cache_dir)
    inside_moltkestrasse_18 = Point(413_719.0, 5_316_336.0, srid=25832)

    found = Building.objects.filter(footprint__contains=inside_moltkestrasse_18)

    assert [b.gml_id for b in found] == ["DEBW_0010007TuWn"]


@pytest.mark.django_db
def test_reimporting_a_tile_replaces_it(cache_dir):
    first = import_tile(TILE, cache_dir)
    second = import_tile(TILE, cache_dir)

    assert second == first
    assert Building.objects.count() == 2
    assert Roof.objects.count() == first.roofs


@pytest.mark.django_db
def test_buildings_already_stored_by_a_neighbouring_tile_are_skipped(cache_dir):
    import_tile(TILE, cache_dir)
    neighbour = Tile.objects.create(id="411_5316")
    Building.objects.filter(gml_id="DEBW_0010007TuWn").update(tile=neighbour)

    result = import_tile(TILE, cache_dir)

    assert (result.buildings, result.skipped_existing) == (1, 1)
    assert Building.objects.get(gml_id="DEBW_0010007TuWn").tile_id == "411_5316"


def test_repaired_geometry_collections_keep_only_their_polygons():
    square = Polygon(((0, 0), (1, 0), (1, 1), (0, 1), (0, 0)), srid=25832)
    mixed = GeometryCollection(square, LineString((0, 0), (2, 2)), srid=25832)

    result = _as_multipolygon(mixed)

    assert result.geom_type == "MultiPolygon"
    assert result.area == pytest.approx(1)
