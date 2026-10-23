from django.urls import path

from estimates.views import estimate

urlpatterns = [
    path("", estimate, name="estimate"),
]
