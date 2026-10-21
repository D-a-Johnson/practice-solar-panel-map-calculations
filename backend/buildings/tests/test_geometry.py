import math

import pytest

from buildings.geometry import (
    area,
    direction_label,
    newell_normal,
    open_ring,
    orientation,
    pvgis_aspect,
)


def south_roof(width=4.0, slope_length=3.0, tilt=30.0):
    """A rectangle rising from an eave at y=0 to a ridge further north."""
    run = slope_length * math.cos(math.radians(tilt))
    rise = slope_length * math.sin(math.radians(tilt))
    return [(0.0, 0.0, 0.0), (width, 0.0, 0.0), (width, run, rise), (0.0, run, rise)]


def turn_clockwise(ring, degrees):
    a = math.radians(degrees)
    return [
        (x * math.cos(a) + y * math.sin(a), -x * math.sin(a) + y * math.cos(a), z)
        for x, y, z in ring
    ]


def move(ring, dx, dy, dz):
    return [(x + dx, y + dy, z + dz) for x, y, z in ring]


def angular_gap(a, b):
    return abs((a - b + 180) % 360 - 180)


def test_open_ring_drops_the_repeated_closing_point():
    ring = [(0, 0, 0), (1, 0, 0), (1, 1, 0), (0, 0, 0)]
    assert open_ring(ring) == [(0, 0, 0), (1, 0, 0), (1, 1, 0)]


def test_newell_normal_of_a_flat_square_points_up_with_twice_its_area():
    square = [(0, 0, 0), (2, 0, 0), (2, 2, 0), (0, 2, 0)]
    assert newell_normal(square) == (0, 0, 8)


def test_south_roof_has_its_built_in_tilt_azimuth_and_area():
    face = orientation(south_roof())
    assert face.tilt == pytest.approx(30)
    assert face.azimuth == pytest.approx(180)
    assert area(south_roof()) == pytest.approx(12)


@pytest.mark.parametrize("turn", [0, 45, 90, 100, 135, 180, 225, 270, 315])
def test_turning_a_roof_turns_its_azimuth_by_the_same_angle(turn):
    face = orientation(turn_clockwise(south_roof(), turn))
    assert face.tilt == pytest.approx(30)
    assert angular_gap(face.azimuth, 180 + turn) < 1e-9


def test_results_survive_utm_sized_coordinates():
    far_away = move(turn_clockwise(south_roof(), 37), 414_000.0, 5_316_000.0, 280.0)
    face = orientation(far_away)
    assert face.tilt == pytest.approx(30, abs=1e-6)
    assert angular_gap(face.azimuth, 217) < 1e-6
    assert area(far_away) == pytest.approx(12, abs=1e-6)


def test_a_closed_ring_gives_the_same_result_as_an_open_one():
    ring = south_roof()
    assert orientation(ring + [ring[0]]) == orientation(ring)
    assert area(ring + [ring[0]]) == pytest.approx(area(ring))


def test_wall_facing_east_is_vertical():
    wall = [(0, 0, 0), (0, 4, 0), (0, 4, 3), (0, 0, 3)]
    face = orientation(wall)
    assert face.tilt == pytest.approx(90)
    assert face.azimuth == pytest.approx(90)


def test_flat_roof_has_no_azimuth():
    roof = [(0, 0, 5), (4, 0, 5), (4, 3, 5), (0, 3, 5)]
    assert orientation(roof).tilt == pytest.approx(0)
    assert orientation(roof).azimuth is None


def test_nearly_flat_roof_still_reports_its_direction():
    face = orientation(south_roof(tilt=0.05))
    assert face.tilt == pytest.approx(0.05)
    assert face.azimuth == pytest.approx(180)


def test_reversed_roof_faces_down_unless_facing_up_is_requested():
    reversed_roof = list(reversed(south_roof()))
    down = orientation(reversed_roof)
    assert down.tilt == pytest.approx(150)
    assert angular_gap(down.azimuth, 0) < 1e-9
    up = orientation(reversed_roof, facing_up=True)
    assert up.tilt == pytest.approx(30)
    assert up.azimuth == pytest.approx(180)


def test_area_subtracts_holes():
    outer = [(0, 0, 0), (10, 0, 0), (10, 10, 0), (0, 10, 0)]
    hole = [(4, 4, 0), (4, 6, 0), (6, 6, 0), (6, 4, 0)]
    assert area(outer, [hole]) == pytest.approx(96)


def test_a_ring_without_area_has_no_orientation():
    line = [(0, 0, 0), (1, 1, 1), (2, 2, 2)]
    assert area(line) == 0
    with pytest.raises(ValueError):
        orientation(line)


def test_real_lod2_roof_face_from_freiburg():
    """West-facing roof of building DEBW_0010007TuWn in tile 413_5316."""
    ring = [
        (413722.96, 5316339.757, 288.941),
        (413717.2, 5316340.79, 284.145),
        (413715.6, 5316331.96, 284.126),
        (413721.38, 5316330.905, 288.941),
        (413722.96, 5316339.757, 288.941),
    ]
    face = orientation(ring, facing_up=True)
    assert face.tilt == pytest.approx(39.3, abs=0.05)
    assert face.azimuth == pytest.approx(280.1, abs=0.05)
    assert area(ring) == pytest.approx(68.1, abs=0.05)
    assert direction_label(face.azimuth) == "W"


@pytest.mark.parametrize(
    ("azimuth", "label"),
    [
        (0, "N"),
        (22.4, "N"),
        (22.5, "NE"),
        (67.5, "E"),
        (90, "E"),
        (180, "S"),
        (270, "W"),
        (337.4, "NW"),
        (337.5, "N"),
        (359.9, "N"),
        (360, "N"),
        (-45, "NW"),
    ],
)
def test_direction_label(azimuth, label):
    assert direction_label(azimuth) == label


@pytest.mark.parametrize(
    ("azimuth", "aspect"),
    [(180, 0), (270, 90), (90, -90), (0, -180), (100.1, -79.9), (359, 179)],
)
def test_pvgis_aspect(azimuth, aspect):
    assert pvgis_aspect(azimuth) == pytest.approx(aspect)
