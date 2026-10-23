import io

import pytest
from django.core.management import CommandError, call_command

from buildings.importer import ImportResult
from buildings.management.commands import import_area
from buildings.models import Tile
from buildings.tiles import TileDownloadFailed, TileNotAvailable

TWO_TILES = ("7.852", "47.995", "7.865", "47.996")


@pytest.fixture
def imports(monkeypatch):
    """Fake importer: records tiles, fails for the ids listed in `failures`."""
    calls = []
    failures = {}

    def fake(tile, cache_dir):
        calls.append(str(tile))
        if str(tile) in failures:
            raise failures[str(tile)]
        Tile.objects.create(id=str(tile))
        return ImportResult(str(tile), 3, 30, 0)

    monkeypatch.setattr(import_area, "import_tile", fake)
    return calls, failures


def run(*args):
    out = io.StringIO()
    call_command("import_area", *args, stdout=out, stderr=io.StringIO())
    return out.getvalue()


@pytest.mark.django_db
def test_dry_run_lists_tiles_without_importing(imports):
    calls, _ = imports
    output = run(*TWO_TILES, "--dry-run")
    assert "413_5316 415_5316" in output
    assert calls == []


@pytest.mark.django_db
def test_already_imported_tiles_are_skipped(imports):
    calls, _ = imports
    Tile.objects.create(id="413_5316")
    output = run(*TWO_TILES)
    assert calls == ["415_5316"]
    assert "1 already imported" in output


@pytest.mark.django_db
def test_failed_downloads_do_not_stop_the_other_tiles(imports):
    calls, failures = imports
    failures["413_5316"] = TileDownloadFailed("LGL down")

    with pytest.raises(CommandError, match="413_5316"):
        run(*TWO_TILES)

    assert calls == ["413_5316", "415_5316"]
    assert list(Tile.objects.values_list("id", flat=True)) == ["415_5316"]


@pytest.mark.django_db
def test_tiles_without_data_are_reported_not_failed(imports):
    _, failures = imports
    failures["415_5316"] = TileNotAvailable("404")
    output = run(*TWO_TILES)
    assert "415_5316: no LoD2 data" in output
