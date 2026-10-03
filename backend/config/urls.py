"""
Root URL configuration: maps request paths to views.

Feature apps will add their own URL modules here with ``include()``.
"""

from django.contrib import admin
from django.urls import path

from config.views import health

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", health, name="health"),
]
