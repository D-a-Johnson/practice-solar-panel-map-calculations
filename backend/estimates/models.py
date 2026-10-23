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
