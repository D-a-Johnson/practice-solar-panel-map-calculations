from rest_framework import serializers

from buildings.serializers import LocationSerializer
from estimates.models import Assumption, PvgisResult


class EstimateQuerySerializer(LocationSerializer):
    tilt = serializers.FloatField(min_value=0, max_value=90)
    azimuth = serializers.FloatField(min_value=0, max_value=360)


class YieldPerKwpSerializer(serializers.ModelSerializer):
    annual_kwh_per_kwp = serializers.FloatField(source="annual_kwh")
    monthly_kwh_per_kwp = serializers.ListField(
        child=serializers.FloatField(),
        source="monthly_kwh",
        min_length=12,
        max_length=12,
    )

    class Meta:
        model = PvgisResult
        fields = ("annual_kwh_per_kwp", "monthly_kwh_per_kwp")


class AssumptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assumption
        fields = ("label", "value", "unit", "source", "source_url", "as_of")
        read_only_fields = fields


# Only describes the response for the API docs; the view builds it from the
# Assumption rows that migration 0003 seeds.
class AssumptionsSerializer(serializers.Serializer):
    """The five values that savings, payback and CO₂ are calculated from."""

    electricity_price = AssumptionSerializer()
    feed_in_tariff = AssumptionSerializer()
    self_consumption_share = AssumptionSerializer()
    system_cost_per_kwp = AssumptionSerializer()
    grid_co2_factor = AssumptionSerializer()
