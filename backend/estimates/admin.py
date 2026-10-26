from django.contrib import admin

from estimates.models import Assumption


@admin.register(Assumption)
class AssumptionAdmin(admin.ModelAdmin):
    list_display = ("key", "value", "unit", "as_of")
    readonly_fields = ("key",)
