"""
Root URL configuration. Every app is mounted under ``api/`` and lists its
own full paths in its ``urls.py``; only project-level routes (the health
check and the API description) are routed here directly.
"""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from config.views import health

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", health, name="health"),
    path("api/schema", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    path("api/", include("buildings.urls")),
    path("api/", include("estimates.urls")),
]
