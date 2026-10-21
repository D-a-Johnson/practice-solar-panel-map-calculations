import io
import zipfile

import httpx
import pytest

from buildings.tiles import (
    TileDownloadFailed,
    TileId,
    TileNotAvailable,
    download_tile,
    gml_members,
    tile_for_lonlat,
    tile_for_utm,
    tiles_near,
)


@pytest.mark.parametrize(
    ("x", "y", "expected"),
    [
        (414_373.1, 5_316_481.9, "413_5316"),
        (413_000.0, 5_316_000.0, "413_5316"),
        (414_999.99, 5_317_999.99, "413_5316"),
        (415_000.0, 5_318_000.0, "415_5318"),
        (412_999.99, 5_315_999.99, "411_5314"),
    ],
)
def test_tile_for_utm_uses_odd_east_and_even_north_corners(x, y, expected):
    assert str(tile_for_utm(x, y)) == expected


@pytest.mark.parametrize(
    ("lon", "lat", "expected"),
    [
        (7.8522, 47.9959, "413_5316"),
        (9.1800, 48.7784, "513_5402"),
    ],
)
def test_tile_for_lonlat(lon, lat, expected):
    assert str(tile_for_lonlat(lon, lat)) == expected


def test_tile_url_follows_lgl_naming():
    assert TileId(413, 5316).url == (
        "https://opengeodata.lgl-bw.de/data/lod2/LoD2_32_413_5316_2_bw.zip"
    )


def fake_zip(*names):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        for name in names:
            archive.writestr(name, "<CityModel/>")
    return buffer.getvalue()


def client_answering(status, body=b""):
    requests = []

    def handler(request):
        requests.append(request)
        return httpx.Response(status, content=body)

    return httpx.Client(transport=httpx.MockTransport(handler)), requests


def test_download_writes_the_zip_into_the_cache(tmp_path):
    body = fake_zip("LoD2_32_413_5316_1_BW.gml")
    client, requests = client_answering(200, body)

    path = download_tile(TileId(413, 5316), tmp_path, client)

    assert path == tmp_path / "LoD2_32_413_5316_2_bw.zip"
    assert path.read_bytes() == body
    assert [str(r.url) for r in requests] == [TileId(413, 5316).url]
    assert not list(tmp_path.glob("*.part"))


def test_download_uses_the_cache_instead_of_the_network(tmp_path):
    cached = tmp_path / "LoD2_32_413_5316_2_bw.zip"
    cached.write_bytes(b"already here")
    client, requests = client_answering(500)

    assert download_tile(TileId(413, 5316), tmp_path, client) == cached
    assert requests == []


def test_missing_tile_raises_and_leaves_no_file(tmp_path):
    client, _ = client_answering(404)

    with pytest.raises(TileNotAvailable):
        download_tile(TileId(301, 5300), tmp_path, client)
    assert list(tmp_path.iterdir()) == []


def test_server_error_raises_and_leaves_no_cached_zip(tmp_path):
    client, _ = client_answering(503)

    with pytest.raises(TileDownloadFailed):
        download_tile(TileId(413, 5316), tmp_path, client)
    assert not (tmp_path / "LoD2_32_413_5316_2_bw.zip").exists()


def test_unreachable_server_raises_download_failed(tmp_path):
    def handler(request):
        raise httpx.ConnectTimeout("timed out", request=request)

    client = httpx.Client(transport=httpx.MockTransport(handler))
    with pytest.raises(TileDownloadFailed):
        download_tile(TileId(413, 5316), tmp_path, client)
    assert list(tmp_path.iterdir()) == []


def test_gml_members_lists_only_the_city_model_files(tmp_path):
    path = tmp_path / "tile.zip"
    path.write_bytes(
        fake_zip(
            "dir/LoD2_32_414_5316_1_BW.gml",
            "dir/LoD2_32_413_5316_1_BW.gml",
            "dir/GOVDATA-Datenlizenz_Deutschland.pdf",
        )
    )
    assert gml_members(path) == [
        "dir/LoD2_32_413_5316_1_BW.gml",
        "dir/LoD2_32_414_5316_1_BW.gml",
    ]


@pytest.mark.parametrize(("east", "north"), [(414, 5316), (413, 5317)])
def test_tile_id_rejects_corners_that_lgl_never_uses(east, north):
    with pytest.raises(ValueError):
        TileId(east, north)


@pytest.mark.parametrize(
    ("x", "y", "expected"),
    [
        (414_000.0, 5_317_000.0, {"413_5316"}),
        (413_020.0, 5_317_000.0, {"413_5316", "411_5316"}),
        (414_990.0, 5_317_990.0, {"413_5316", "415_5316", "413_5318", "415_5318"}),
    ],
)
def test_tiles_near_adds_neighbours_only_close_to_an_edge(x, y, expected):
    assert {str(t) for t in tiles_near(x, y, 50.0)} == expected
