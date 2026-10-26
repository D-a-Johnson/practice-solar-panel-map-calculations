from django.contrib.postgres.fields import ArrayField
from django.db import models


class PvgisResult(models.Model):
    """PVGIS output for a 1 kWp system; yield scales linearly with size."""

    lat = models.FloatField()
    lon = models.FloatField()
    tilt = models.SmallIntegerField()
    aspect = models.SmallIntegerField()
    annual_kwh = models.FloatField()
    monthly_kwh = ArrayField(models.FloatField(), size=12)

    class Meta:
        constraints = (
            models.UniqueConstraint(
                fields=["lat", "lon", "tilt", "aspect"], name="unique_pvgis_inputs"
            ),
        )

    def __str__(self) -> str:
        return f"{self.lat},{self.lon} tilt {self.tilt} aspect {self.aspect}"


class Assumption(models.Model):
    """A number the economics depend on, with where it came from and when."""

    key = models.SlugField(max_length=40, unique=True)
    label = models.CharField(max_length=80)
    value = models.FloatField()
    unit = models.CharField(max_length=20)
    source = models.CharField(max_length=200)
    source_url = models.URLField(max_length=300)
    as_of = models.CharField(max_length=20)

    def __str__(self) -> str:
        return f"{self.key} = {self.value} {self.unit}"
