"""
LGL LoD2 tiles: which tile covers a point, and a local cache of downloads.

LGL publishes LoD2 as 2×2 km zip files in EPSG:25832, named after the
tile's lower-left corner in km. That corner always has an odd east value
and an even north value, so a tile spans e.g. 413–415 km east and
5316–5318 km north.
"""

import math
import zipfile
from dataclasses import dataclass
from pathlib import Path

import httpx
from django.contrib.gis.geos import Point

TILE_URL = "https://opengeodata.lgl-bw.de/data/lod2/{name}"
DOWNLOAD_TIMEOUT_S = 60.0


class TileNotAvailable(Exception):
    pass


@dataclass(frozen=True)
class TileId:
    east_km: int
    north_km: int

    def __post_init__(self) -> None:
        if self.east_km % 2 == 0 or self.north_km % 2 == 1:
            raise ValueError(
                f"{self} is not a tile corner: east must be odd and north even"
            )

    def __str__(self) -> str:
        return f"{self.east_km}_{self.north_km}"

    @property
    def zip_name(self) -> str:
        return f"LoD2_32_{self}_2_bw.zip"

    @property
    def url(self) -> str:
        return TILE_URL.format(name=self.zip_name)


def tile_for_utm(x: float, y: float) -> TileId:
    return TileId(
        east_km=math.floor((x / 1000 - 1) / 2) * 2 + 1,
        north_km=math.floor(y / 2000) * 2,
    )


def tile_for_lonlat(lon: float, lat: float) -> TileId:
    point = Point(lon, lat, srid=4326)
    point.transform(25832)
    return tile_for_utm(point.x, point.y)


def download_tile(
    tile: TileId, cache_dir: Path, client: httpx.Client | None = None
) -> Path:
    target = cache_dir / tile.zip_name
    if target.exists():
        return target
    cache_dir.mkdir(parents=True, exist_ok=True)
    if client is None:
        with httpx.Client(timeout=DOWNLOAD_TIMEOUT_S) as own_client:
            _fetch(own_client, tile, target)
    else:
        _fetch(client, tile, target)
    return target


def _fetch(client: httpx.Client, tile: TileId, target: Path) -> None:
    """
    Writes to a `.part` file and renames it at the end, so an interrupted
    download never leaves a truncated zip that looks like a cached tile.
    """
    partial = target.with_name(target.name + ".part")
    with client.stream("GET", tile.url) as response:
        if response.status_code == 404:
            raise TileNotAvailable(f"LGL has no LoD2 tile {tile}")
        response.raise_for_status()
        with partial.open("wb") as file:
            for chunk in response.iter_bytes():
                file.write(chunk)
    partial.replace(target)


def gml_members(zip_path: Path) -> list[str]:
    with zipfile.ZipFile(zip_path) as archive:
        return sorted(n for n in archive.namelist() if n.lower().endswith(".gml"))
