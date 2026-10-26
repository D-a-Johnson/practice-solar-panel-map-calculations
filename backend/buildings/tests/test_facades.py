import pytest
from django.contrib.gis.geos import MultiPolygon, Polygon

from buildings.facades import facades

SQUARE = ((0, 0), (10, 0), (10, 10), (0, 10), (0, 0))


def footprint(*rings):
    return MultiPolygon(Polygon(*rings), srid=25832)


def azimuths(found):
    return sorted(round(facade.azimuth) for facade in found)


def test_each_side_of_a_square_faces_away_from_the_building():
    found = facades(footprint(SQUARE))

    assert azimuths(found) == [0, 90, 180, 270]
    assert {facade.width for facade in found} == {10}
    south = next(facade for facade in found if round(facade.azimuth) == 180)
    assert {south.start, south.end} == {(0, 0), (10, 0)}


def test_ring_direction_does_not_matter():
    assert azimuths(facades(footprint(SQUARE[::-1]))) == [0, 90, 180, 270]


def test_courtyard_facades_face_into_the_courtyard():
    courtyard = ((3, 3), (7, 3), (7, 7), (3, 7), (3, 3))

    found = [
        facade for facade in facades(footprint(SQUARE, courtyard)) if facade.width == 4
    ]

    north_side = next(
        facade for facade in found if {facade.start, facade.end} == {(3, 7), (7, 7)}
    )
    assert round(north_side.azimuth) == 180


def test_a_straight_facade_split_by_a_vertex_counts_once():
    split = ((0, 0), (5, 0), (10, 0), (10, 10), (0, 10), (0, 0))

    assert [facade.width for facade in facades(footprint(split))] == [10, 10, 10, 10]


def test_narrow_facades_are_left_out_and_the_widest_comes_first():
    step = ((0, 0), (10, 0), (10, 4), (9, 4), (9, 6), (0, 6), (0, 0))

    widths = [facade.width for facade in facades(footprint(step))]

    assert widths == pytest.approx([10, 9, 6, 4, 2])


def test_parts_that_nearly_touch_have_no_wall_between_them():
    east_part = ((10.01, 0), (20, 0), (20, 10), (10.01, 10), (10.01, 0))
    parts = MultiPolygon(Polygon(SQUARE), Polygon(east_part), srid=25832)

    assert azimuths(facades(parts)) == [0, 0, 90, 180, 180, 270]
