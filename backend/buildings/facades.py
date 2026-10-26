"""
Facades for balcony and wall panels, taken from a building's footprint.

Wall surfaces aren't imported (see ``lod2_parser.SURFACE_KINDS``), and they
aren't needed here: in tile 413_5316, 19,652 of 19,654 LoD2 walls are
vertical, and 99.4 % of the wall area faces the same way as an edge of its
building's footprint. So every long enough footprint edge is a facade that
faces away from the building.
"""

import math
from collections.abc import Sequence
from dataclasses import dataclass
from itertools import pairwise

from django.contrib.gis.geos import MultiPolygon

Point = tuple[float, float]

# Building parts leave a vertex where they meet, which splits one straight
# facade into pieces. Removing vertices within 10 cm of a straight line
# merges them (44,739 facades become 38,642 in tile 413_5316) without
# hiding real steps in a wall.
SIMPLIFY_TOLERANCE_M = 0.1

# A product choice, not a measured limit: narrower facades aren't offered.
MIN_WIDTH_M = 2.0


@dataclass(frozen=True)
class Facade:
    start: Point
    end: Point
    azimuth: float

    @property
    def width(self) -> float:
        return math.dist(self.start, self.end)


def facades(footprint: MultiPolygon) -> list[Facade]:
    """All facades of at least ``MIN_WIDTH_M``, widest first."""
    found = []
    simplified = footprint.simplify(SIMPLIFY_TOLERANCE_M, preserve_topology=True)
    # GEOS returns a plain Polygon for a MultiPolygon with one member.
    polygons = [simplified] if simplified.geom_type == "Polygon" else simplified
    for polygon in polygons:
        for index, ring in enumerate(polygon):
            points = ring.coords
            # Walking a counter-clockwise ring, its inside is on the left.
            # Inside the outer ring is the building, so a facade faces right;
            # inside a courtyard ring is the courtyard, so it faces left.
            faces_right = (_signed_area(points) > 0) == (index == 0)
            for start, end in pairwise(points):
                dx, dy = end[0] - start[0], end[1] - start[1]
                if math.hypot(dx, dy) < MIN_WIDTH_M:
                    continue
                nx, ny = (dy, -dx) if faces_right else (-dy, dx)
                azimuth = math.degrees(math.atan2(nx, ny)) % 360
                found.append(Facade(start, end, azimuth))
    outside = [
        facade
        for facade in found
        if not any(_back_to_back(facade, other) for other in found)
    ]
    return sorted(outside, key=lambda facade: facade.width, reverse=True)


def _back_to_back(facade: Facade, other: Facade) -> bool:
    """
    The same line facing both ways: two parts of a footprint that touch, or
    nearly do, with an inside wall between them (62 of 38,642 facades in
    tile 413_5316).
    """
    return (
        math.dist(facade.start, other.end) < SIMPLIFY_TOLERANCE_M
        and math.dist(facade.end, other.start) < SIMPLIFY_TOLERANCE_M
    )


def _signed_area(points: Sequence[Point]) -> float:
    """Shoelace formula: positive for counter-clockwise rings."""
    return sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in pairwise(points)) / 2
