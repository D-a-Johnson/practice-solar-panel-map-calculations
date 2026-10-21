"""
Streaming reader for LGL's CityGML LoD2 building files.

Tags are matched by local name (`{*}`), because CityGML 1.0 and 2.0 differ
only in their namespace URIs. Each building is handed out at its closing
tag and then cleared, so memory stays flat however large the file is.
"""

import zipfile
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO, Literal

from lxml import etree

from buildings.geometry import Point
from buildings.tiles import gml_members

type SurfaceKind = Literal["roof", "wall", "ground"]
type Ring = tuple[Point, ...]

# ClosureSurfaces are left out on purpose: they are virtual faces that seal
# a solid where building parts meet, not real roofs or walls.
SURFACE_KINDS: dict[str, SurfaceKind] = {
    "RoofSurface": "roof",
    "WallSurface": "wall",
    "GroundSurface": "ground",
}


@dataclass(frozen=True)
class Address:
    street: str | None
    house_number: str | None
    locality: str | None


@dataclass(frozen=True)
class ParsedSurface:
    gml_id: str
    kind: SurfaceKind
    exterior: Ring
    holes: tuple[Ring, ...]
    roof_type: str | None


@dataclass(frozen=True)
class ParsedBuilding:
    gml_id: str
    name: str | None
    function: str | None
    measured_height: float | None
    addresses: tuple[Address, ...]
    surfaces: tuple[ParsedSurface, ...]


def iter_buildings(zip_path: Path) -> Iterator[ParsedBuilding]:
    with zipfile.ZipFile(zip_path) as archive:
        for member in gml_members(zip_path):
            with archive.open(member) as file:
                yield from parse_city_model(file)


def parse_city_model(source: BinaryIO | Path | str) -> Iterator[ParsedBuilding]:
    for _, element in etree.iterparse(
        source, events=("end",), tag="{*}Building", resolve_entities=False
    ):
        yield _building(element)
        element.clear()


def _building(element: etree._Element) -> ParsedBuilding:
    building_id = _gml_id(element)
    if building_id is None:
        raise ValueError("Building without gml:id")
    parts = element.findall("{*}consistsOfBuildingPart/{*}BuildingPart")
    solids = [element, *parts]
    heights = [
        float(text) for solid in solids if (text := solid.findtext("{*}measuredHeight"))
    ]
    return ParsedBuilding(
        gml_id=building_id,
        name=element.findtext("{*}name"),
        function=element.findtext("{*}function"),
        measured_height=max(heights, default=None),
        addresses=tuple(_address(a) for a in element.iterfind("{*}address/{*}Address")),
        surfaces=tuple(
            surface for solid in solids for surface in _surfaces(solid, building_id)
        ),
    )


def _surfaces(solid: etree._Element, building_id: str) -> Iterator[ParsedSurface]:
    """
    Only the solid's own `boundedBy` children: a Building's parts carry their
    surfaces (and their own roof type) one level deeper.
    """
    roof_type = solid.findtext("{*}roofType")
    for thematic in solid.iterfind("{*}boundedBy/*"):
        kind = SURFACE_KINDS.get(etree.QName(thematic).localname)
        if kind is None:
            continue
        for polygon in thematic.iterfind(".//{*}Polygon"):
            polygon_id = _gml_id(polygon)
            if polygon_id is None:
                raise ValueError(f"Polygon without gml:id in {building_id}")
            yield ParsedSurface(
                gml_id=polygon_id,
                kind=kind,
                exterior=_ring(polygon.find("{*}exterior")),
                holes=tuple(_ring(hole) for hole in polygon.iterfind("{*}interior")),
                roof_type=roof_type,
            )


def _ring(boundary: etree._Element) -> Ring:
    values = [float(v) for v in boundary.find(".//{*}posList").text.split()]
    return tuple(zip(values[0::3], values[1::3], values[2::3], strict=True))


def _address(address: etree._Element) -> Address:
    return Address(
        street=address.findtext(".//{*}ThoroughfareName"),
        house_number=address.findtext(".//{*}ThoroughfareNumber"),
        locality=address.findtext(".//{*}LocalityName"),
    )


def _gml_id(element: etree._Element) -> str | None:
    return next(
        (
            value
            for key, value in element.attrib.items()
            if etree.QName(key).localname == "id"
        ),
        None,
    )
