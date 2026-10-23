from rest_framework import serializers

from buildings.serializers import LocationSerializer


class EstimateQuerySerializer(LocationSerializer):
    tilt = serializers.FloatField(min_value=0, max_value=90)
    azimuth = serializers.FloatField(min_value=0, max_value=360)
