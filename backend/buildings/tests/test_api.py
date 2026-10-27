import threading
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest
from django.contrib.gis.geos import Point
from django.db import connection

from buildings import importer, lookup
from buildings.models import Building, Tile
from buildings.tiles import TileDownloadFailed, TileId, TileNotAvailable

FIXTURE = Path(__file__).parent / "fixtures" / "freiburg_two_buildings.gml"
URL = "/api/buildings/at"


@pytest.fixture
def lod2_cache(tmp_path, settings):
    with zipfile.ZipFile(tmp_path / TileId(413, 5316).zip_name, "w") as archive:
        archive.write(FIXTURE, "tile/LoD2_32_413_5316_1_BW.gml")
    settings.LOD2_CACHE_DIR = tmp_path
    return tmp_path


def lonlat(x, y):
    point = Point(x, y, srid=25832)
    point.transform(4326)
    return {"lon": point.x, "lat": point.y}


INSIDE_MOLTKESTRASSE_18 = lonlat(413_719.0, 5_316_336.0)


@pytest.fixture
def fake_import(monkeypatch):
    """Records requested tiles and stores them empty, without downloading."""
    imported = []

    def fake(tile, cache_dir):
        imported.append(str(tile))
        Tile.objects.create(id=str(tile))

    monkeypatch.setattr(lookup, "import_tile_if_missing", fake)
    return imported


@pytest.mark.django_db
def test_returns_the_building_under_the_click(client, lod2_cache):
    response = client.get(URL, INSIDE_MOLTKESTRASSE_18)

    assert response.status_code == 200
    body = response.json()
    assert body["gml_id"] == "DEBW_0010007TuWn"
    assert (body["street"], body["house_number"]) == ("Moltkestraße", "18")
    assert body["footprint"]["type"] == "MultiPolygon"
    lon, lat = body["footprint"]["coordinates"][0][0][0]
    assert (round(lon, 2), round(lat, 2)) == (7.84, 47.99)


@pytest.mark.django_db
def test_roofs_largest_first_with_direction_and_3d_geometry(client, lod2_cache):
    roofs = client.get(URL, INSIDE_MOLTKESTRASSE_18).json()["roofs"]

    assert [(r["kind"], r["direction"]) for r in roofs] == [
        ("roof", "W"),
        ("roof", "E"),
    ]
    assert roofs[0]["area"] == pytest.approx(68.1, abs=0.05)
    assert len(roofs[0]["geometry"]["coordinates"][0][0]) == 3


@pytest.mark.django_db
def test_walls_come_from_the_footprint_widest_first_as_lon_lat_lines(
    client, lod2_cache
):
    walls = client.get(URL, INSIDE_MOLTKESTRASSE_18).json()["walls"]

    assert [wall["direction"] for wall in walls] == ["S", "N", "W", "E"]
    assert {(wall["kind"], wall["tilt"]) for wall in walls} == {("wall", 90.0)}
    assert walls[0]["width"] == pytest.approx(10.4, abs=0.05)
    (lon, lat), _ = walls[0]["geometry"]["coordinates"]
    assert (round(lon, 2), round(lat, 2)) == (7.84, 47.99)
    assert lon == round(lon, 7)


@pytest.mark.django_db
def test_coordinates_are_rounded_to_seven_decimals(client, lod2_cache):
    body = client.get(URL, INSIDE_MOLTKESTRASSE_18).json()
    lon, lat = body["footprint"]["coordinates"][0][0][0]
    roof_lon = body["roofs"][0]["geometry"]["coordinates"][0][0][0]
    for value in (lon, lat, roof_lon):
        assert value == round(value, 7)


@pytest.mark.django_db
def test_a_click_just_outside_the_footprint_snaps_to_it(client, lod2_cache):
    client.get(URL, INSIDE_MOLTKESTRASSE_18)
    footprint = Building.objects.get(gml_id="DEBW_0010007TuWn").footprint
    west_x, west_y = min(footprint.coords[0][0], key=lambda corner: corner[0])

    near = client.get(URL, lonlat(west_x - 3, west_y))
    far = client.get(URL, lonlat(west_x - 10, west_y))

    assert near.json()["gml_id"] == "DEBW_0010007TuWn"
    assert far.status_code == 404


@pytest.mark.django_db
def test_a_tile_is_imported_only_once(client, lod2_cache, monkeypatch):
    calls = []
    real_import = lookup.import_tile_if_missing

    def counting_import(tile, cache_dir):
        calls.append(str(tile))
        return real_import(tile, cache_dir)

    monkeypatch.setattr(lookup, "import_tile_if_missing", counting_import)
    client.get(URL, INSIDE_MOLTKESTRASSE_18)
    client.get(URL, INSIDE_MOLTKESTRASSE_18)

    assert calls == ["413_5316"]


@pytest.mark.django_db(transaction=True)
def test_parallel_lookups_in_a_new_tile_import_it_once(lod2_cache, monkeypatch):
    """Two threads with their own database connections, like two workers."""
    saved_batches = []
    real_save_batch = importer._save_batch
    both_ready = threading.Barrier(2)

    def slow_save_batch(tile, batch):
        saved_batches.append(tile.id)
        # Keeps the import's transaction open while the other lookup arrives.
        time.sleep(0.5)
        return real_save_batch(tile, batch)

    def look_up(_):
        try:
            both_ready.wait()
            return lookup.building_at(**INSIDE_MOLTKESTRASSE_18).gml_id
        finally:
            connection.close()

    monkeypatch.setattr(importer, "_save_batch", slow_save_batch)
    with ThreadPoolExecutor(max_workers=2) as pool:
        found = list(pool.map(look_up, range(2)))

    assert found == ["DEBW_0010007TuWn", "DEBW_0010007TuWn"]
    assert saved_batches == ["413_5316"]


@pytest.mark.django_db
def test_structures_such_as_bridges_cannot_be_selected(client, lod2_cache):
    client.get(URL, INSIDE_MOLTKESTRASSE_18)
    Building.objects.filter(gml_id="DEBW_0010007TuWn").update(function="53001_1800")

    assert client.get(URL, INSIDE_MOLTKESTRASSE_18).status_code == 404


@pytest.mark.django_db
def test_an_empty_spot_near_a_tile_edge_also_imports_the_neighbour(client, fake_import):
    response = client.get(URL, lonlat(413_020.0, 5_317_000.0))

    assert response.status_code == 404
    assert response.json() == {"detail": "No building at this location."}
    assert fake_import[0] == "413_5316"
    assert set(fake_import) == {"413_5316", "411_5316"}


@pytest.mark.django_db
def test_a_location_without_lod2_data_is_reported(client, monkeypatch):
    def missing(tile, cache_dir):
        raise TileNotAvailable(str(tile))

    monkeypatch.setattr(lookup, "import_tile_if_missing", missing)
    response = client.get(URL, INSIDE_MOLTKESTRASSE_18)

    assert response.status_code == 404
    assert response.json() == {"detail": "No LoD2 data for this location."}


@pytest.mark.django_db
def test_an_unreachable_download_service_answers_503(client, monkeypatch):
    def unreachable(tile, cache_dir):
        raise TileDownloadFailed(str(tile))

    monkeypatch.setattr(lookup, "import_tile_if_missing", unreachable)
    response = client.get(URL, INSIDE_MOLTKESTRASSE_18)

    assert response.status_code == 503


@pytest.mark.parametrize(
    "params",
    [{"lon": 2.35, "lat": 48.86}, {"lon": 7.85}, {"lon": "east", "lat": 47.99}],
)
def test_invalid_locations_are_rejected(client, params):
    assert client.get(URL, params).status_code == 400
