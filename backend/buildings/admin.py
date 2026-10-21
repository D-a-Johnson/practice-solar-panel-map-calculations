from django.contrib.gis import admin

from buildings.models import Building, Surface


@admin.register(Building)
class BuildingAdmin(admin.GISModelAdmin):
    list_display = (
        "gml_id",
        "street",
        "house_number",
        "function",
        "measured_height",
        "tile",
    )
    search_fields = ("gml_id", "street")
    list_filter = ("tile",)


@admin.register(Surface)
class SurfaceAdmin(admin.ModelAdmin):
    list_display = (
        "gml_id",
        "building",
        "kind",
        "roof_type",
        "area",
        "tilt",
        "azimuth",
    )
    list_filter = ("kind", "roof_type")
    list_select_related = ("building",)
    raw_id_fields = ("building",)
