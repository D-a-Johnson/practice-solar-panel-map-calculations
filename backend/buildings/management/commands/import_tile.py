from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from buildings.importer import import_tile
from buildings.tiles import TileDownloadFailed, TileId, TileNotAvailable


class Command(BaseCommand):
    help = "Download an LGL LoD2 tile (unless cached) and import its buildings."

    def add_arguments(self, parser):
        parser.add_argument("east_km", type=int, help="odd km value, e.g. 413")
        parser.add_argument("north_km", type=int, help="even km value, e.g. 5316")

    def handle(self, *args, east_km, north_km, **options):
        try:
            tile = TileId(east_km, north_km)
            result = import_tile(tile, settings.LOD2_CACHE_DIR)
        except (ValueError, TileNotAvailable, TileDownloadFailed) as error:
            raise CommandError(error) from error
        self.stdout.write(
            self.style.SUCCESS(
                f"Tile {result.tile}: {result.buildings} buildings, "
                f"{result.roofs} roof faces, {result.skipped_existing} already "
                "stored from a neighbouring tile"
            )
        )
