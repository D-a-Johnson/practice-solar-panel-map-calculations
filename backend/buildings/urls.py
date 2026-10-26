from django.urls import path

from buildings.views import building_at_location

urlpatterns = [
    path("buildings/at", building_at_location, name="building-at"),
]
