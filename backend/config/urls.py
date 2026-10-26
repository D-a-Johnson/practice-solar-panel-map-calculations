"""
Root URL configuration. Every app is mounted under ``api/`` and lists its
own full paths in its ``urls.py``; only the project-level health check is
routed here directly.
"""

from django.contrib import admin
from django.urls import include, path

from config.views import health

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", health, name="health"),
    path("api/", include("buildings.urls")),
    path("api/", include("estimates.urls")),
]
