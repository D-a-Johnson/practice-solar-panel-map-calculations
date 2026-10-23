import io
import zipfile
from collections import Counter
from pathlib import Path

import pytest

from buildings.geometry import area, orientation
from buildings.lod2_parser import Address, iter_buildings, parse_city_model

FIXTURE = Path(__file__).parent / "fixtures" / "freiburg_two_buildings.gml"
REAL_TILE = Path(__file__).resolve().parents[2] / "data/lod2/LoD2_32_413_5316_2_bw.zip"


@pytest.fixture(scope="module")
def buildings():
    return {b.gml_id: b for b in parse_city_model(FIXTURE)}


def kinds(building):
    return Counter(s.kind for s in building.surfaces)


def test_simple_building_attributes(buildings):
    house = buildings["DEBW_0010007TuWn"]
    assert house.function == "31001_1123"
    assert house.measured_height == pytest.approx(16.552)
    assert house.addresses == (Address("Moltkestraße", "18", "Freiburg im Breisgau"),)
    assert kinds(house) == {"roof": 2, "ground": 1}
    assert {s.roof_type for s in house.surfaces} == {"3100"}


def test_parsed_roof_faces_have_the_expected_orientation(buildings):
    roofs = [s for s in buildings["DEBW_0010007TuWn"].surfaces if s.kind == "roof"]
    faces = [
        (orientation(r.exterior, facing_up=True), area(r.exterior, r.holes))
        for r in roofs
    ]
    (east, east_area), (west, west_area) = sorted(
        faces, key=lambda face: face[0].azimuth
    )
    assert (east.tilt, east.azimuth, east_area) == pytest.approx(
        (39.0, 100.1, 53.3), abs=0.05
    )
    assert (west.tilt, west.azimuth, west_area) == pytest.approx(
        (39.3, 280.1, 68.1), abs=0.05
    )


def test_building_parts_are_merged_and_keep_their_own_roof_type(buildings):
    house = buildings["DEBW_0010007Tw9I"]
    assert house.measured_height == pytest.approx(15.343)
    assert kinds(house) == {"roof": 5, "ground": 2}
    roof_types = Counter(s.roof_type for s in house.surfaces if s.kind == "roof")
    assert roof_types == {"3100": 2, "5000": 3}


def test_closure_and_wall_surfaces_are_left_out():
    text = FIXTURE.read_text(encoding="utf-8")
    assert "ClosureSurface" in text
    assert "WallSurface" in text
    for building in parse_city_model(FIXTURE):
        assert {s.kind for s in building.surfaces} <= {"roof", "ground"}


def test_rings_are_3d_and_closed(buildings):
    for building in buildings.values():
        for surface in building.surfaces:
            assert len(surface.exterior) >= 4
            assert all(len(point) == 3 for point in surface.exterior)
            assert surface.exterior[0] == surface.exterior[-1]


def test_citygml_2_namespaces_give_the_same_result(buildings):
    v2 = FIXTURE.read_text(encoding="utf-8").replace("/1.0", "/2.0")
    parsed = {b.gml_id: b for b in parse_city_model(io.BytesIO(v2.encode()))}
    assert parsed == buildings


MINIMAL_WITH_HOLE = b"""<?xml version="1.0" encoding="UTF-8"?>
<core:CityModel xmlns:core="http://www.opengis.net/citygml/2.0"
    xmlns:bldg="http://www.opengis.net/citygml/building/2.0"
    xmlns:gml="http://www.opengis.net/gml">
  <core:cityObjectMember>
    <bldg:Building gml:id="B1">
      <bldg:roofType>1000</bldg:roofType>
      <bldg:boundedBy>
        <bldg:RoofSurface gml:id="R1">
          <bldg:lod2MultiSurface><gml:MultiSurface><gml:surfaceMember>
            <gml:Polygon gml:id="P1">
              <gml:exterior><gml:LinearRing>
                <gml:posList>0 0 5 10 0 5 10 10 5 0 10 5 0 0 5</gml:posList>
              </gml:LinearRing></gml:exterior>
              <gml:interior><gml:LinearRing>
                <gml:posList>4 4 5 4 6 5 6 6 5 6 4 5 4 4 5</gml:posList>
              </gml:LinearRing></gml:interior>
            </gml:Polygon>
          </gml:surfaceMember></gml:MultiSurface></bldg:lod2MultiSurface>
        </bldg:RoofSurface>
      </bldg:boundedBy>
    </bldg:Building>
  </core:cityObjectMember>
</core:CityModel>
"""


def test_holes_are_read():
    (building,) = parse_city_model(io.BytesIO(MINIMAL_WITH_HOLE))
    (roof,) = building.surfaces
    assert roof.gml_id == "P1"
    assert len(roof.holes) == 1
    assert area(roof.exterior, roof.holes) == pytest.approx(96)
    assert building.measured_height is None
    assert building.addresses == ()


def test_polygon_without_id_is_rejected():
    broken = MINIMAL_WITH_HOLE.replace(b' gml:id="P1"', b"")
    with pytest.raises(ValueError, match="B1"):
        list(parse_city_model(io.BytesIO(broken)))


def test_iter_buildings_reads_every_gml_file_in_a_zip(tmp_path):
    path = tmp_path / "tile.zip"
    with zipfile.ZipFile(path, "w") as archive:
        archive.write(FIXTURE, "tile/LoD2_32_413_5316_1_BW.gml")
        archive.writestr("tile/LoD2_32_414_5316_1_BW.gml", MINIMAL_WITH_HOLE)
        archive.writestr("tile/GOVDATA-Datenlizenz_Deutschland.pdf", b"%PDF")
    ids = [b.gml_id for b in iter_buildings(path)]
    assert ids == ["DEBW_0010007TuWn", "DEBW_0010007Tw9I", "B1"]


@pytest.mark.skipif(not REAL_TILE.exists(), reason="tile 413_5316 not downloaded")
def test_real_tile_matches_the_independent_inspection():
    with zipfile.ZipFile(REAL_TILE) as archive:
        member = next(n for n in archive.namelist() if n.endswith("413_5316_1_BW.gml"))
        with archive.open(member) as file:
            buildings = list(parse_city_model(file))
    polygons = Counter(s.kind for b in buildings for s in b.surfaces)
    assert len(buildings) == 1633
    assert polygons == {"roof": 4885, "ground": 2570}
