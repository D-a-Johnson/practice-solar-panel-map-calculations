from django.urls import path

from estimates.views import assumptions, estimate

urlpatterns = [
    path("estimates", estimate, name="estimate"),
    path("assumptions", assumptions, name="assumptions"),
]
