from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from buildings.importer import import_tile
from buildings.models import Tile
from buildings.tiles import TileDownloadFailed, TileNotAvailable, tiles_in_bbox


class Command(BaseCommand):
    help = (
        "Import every LoD2 tile in a lon/lat bounding box. Tiles already imported "
        "are skipped, so the command can be re-run after failed downloads."
    )

    def add_arguments(self, parser):
        for name in ("west", "south", "east", "north"):
            parser.add_argument(name, type=float, help=f"{name} edge in WGS84 degrees")
        parser.add_argument(
            "--dry-run", action="store_true", help="only list the tiles"
        )

    def handle(self, *args, west, south, east, north, dry_run, **options):
        tiles = tiles_in_bbox(west, south, east, north)
        imported = set(
            Tile.objects.filter(id__in=[str(t) for t in tiles]).values_list(
                "id", flat=True
            )
        )
        todo = [tile for tile in tiles if str(tile) not in imported]
        self.stdout.write(
            f"{len(tiles)} tiles in the area, {len(imported)} already imported, "
            f"{len(todo)} to import"
        )
        if dry_run:
            self.stdout.write(" ".join(str(tile) for tile in todo))
            return

        failed = []
        for number, tile in enumerate(todo, start=1):
            prefix = f"[{number}/{len(todo)}] {tile}:"
            try:
                result = import_tile(tile, settings.LOD2_CACHE_DIR)
            except TileNotAvailable:
                self.stdout.write(f"{prefix} no LoD2 data (outside Baden-Württemberg?)")
            except TileDownloadFailed as error:
                failed.append(str(tile))
                self.stderr.write(f"{prefix} {error}")
            else:
                self.stdout.write(f"{prefix} {result.buildings} buildings")

        if failed:
            raise CommandError(
                f"{len(failed)} tiles could not be downloaded ({', '.join(failed)}). "
                "Run the command again later; imported tiles are skipped."
            )
