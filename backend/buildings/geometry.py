"""
Size and orientation of planar building faces from their 3D outlines.

Coordinates are metres with x east, y north and z up (EPSG:25832 plus
heights). Azimuths are compass bearings: 0 = north, 90 = east, clockwise.
"""

import math
from collections.abc import Sequence
from dataclasses import dataclass

type Point = tuple[float, float, float]
type Vector = tuple[float, float, float]

DIRECTIONS = ("N", "NE", "E", "SE", "S", "SW", "W", "NW")


@dataclass(frozen=True)
class Orientation:
    """
    `tilt` is the angle from horizontal in degrees (0 = flat facing up,
    90 = vertical, 180 = flat facing down). `azimuth` is the compass
    direction the face looks towards, or None for exactly level faces.
    Whether a slightly tilted roof counts as flat is a domain decision that
    belongs where the roof type is known, not here.
    """

    tilt: float
    azimuth: float | None


def open_ring(ring: Sequence[Point]) -> list[Point]:
    points = list(ring)
    if len(points) > 1 and points[0] == points[-1]:
        points.pop()
    return points


def newell_normal(ring: Sequence[Point]) -> Vector:
    """
    Newell's method works for concave and slightly non-planar rings, where
    the cross product of two edges would depend on which edges are picked.
    The vector's length is twice the polygon's area.
    """
    points = open_ring(ring)
    nx = ny = nz = 0.0
    for (x1, y1, z1), (x2, y2, z2) in zip(points, points[1:] + points[:1], strict=True):
        nx += (y1 - y2) * (z1 + z2)
        ny += (z1 - z2) * (x1 + x2)
        nz += (x1 - x2) * (y1 + y2)
    return nx, ny, nz


def area(exterior: Sequence[Point], holes: Sequence[Sequence[Point]] = ()) -> float:
    exterior_area = math.hypot(*newell_normal(exterior)) / 2
    holes_area = sum(math.hypot(*newell_normal(hole)) / 2 for hole in holes)
    return exterior_area - holes_area


def orientation(ring: Sequence[Point], *, facing_up: bool = False) -> Orientation:
    """
    Rings are expected counter-clockwise when seen from outside, so the
    normal points out of the building. `facing_up` flips the normal of a
    face wound the other way, for roofs, where a few LoD2 rings break the
    rule.
    """
    nx, ny, nz = newell_normal(ring)
    length = math.hypot(nx, ny, nz)
    if length == 0:
        raise ValueError("A ring without area has no orientation.")
    if facing_up and nz < 0:
        nx, ny, nz = -nx, -ny, -nz

    # acos raises on anything past ±1; the clamp makes sure a single rounding
    # error can never stop a whole tile import.
    tilt = math.degrees(math.acos(max(-1.0, min(1.0, nz / length))))

    if nx == 0 and ny == 0:
        return Orientation(tilt=tilt, azimuth=None)
    return Orientation(tilt=tilt, azimuth=math.degrees(math.atan2(nx, ny)) % 360)


def direction_label(azimuth: float) -> str:
    """
    Floor division instead of round(): Python's round() sends halves to the
    even number, so 22.5° and 67.5° would land on different sides of their
    boundaries.
    """
    return DIRECTIONS[int((azimuth % 360 + 22.5) // 45) % 8]


def pvgis_aspect(azimuth: float) -> float:
    """
    PVGIS measures orientation from south: 0 = south, 90 = west,
    -90 = east, -180 = north.
    """
    return azimuth % 360 - 180
