from django.contrib.gis.db import models


class Tile(models.Model):
    id = models.CharField(primary_key=True, max_length=16)

    def __str__(self) -> str:
        return self.id


class Building(models.Model):
    gml_id = models.CharField(max_length=32, unique=True)
    tile = models.ForeignKey(Tile, on_delete=models.CASCADE, related_name="buildings")
    name = models.TextField(blank=True)
    function = models.CharField(max_length=16, blank=True)
    measured_height = models.FloatField(null=True)
    street = models.TextField(blank=True)
    house_number = models.TextField(blank=True)
    locality = models.TextField(blank=True)
    footprint = models.MultiPolygonField(srid=25832)

    def __str__(self) -> str:
        return self.gml_id


class Roof(models.Model):
    """
    One roof face. Walls aren't stored: they come from the footprint (see
    facades.py).
    """

    building = models.ForeignKey(
        Building, on_delete=models.CASCADE, related_name="roofs"
    )
    gml_id = models.CharField(max_length=64, unique=True)
    roof_type = models.CharField(max_length=8, blank=True)
    geometry = models.PolygonField(srid=25832, dim=3)
    area = models.FloatField()
    tilt = models.FloatField()
    azimuth = models.FloatField(null=True)

    def __str__(self) -> str:
        return self.gml_id
