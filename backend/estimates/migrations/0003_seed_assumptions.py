from django.db import migrations

ASSUMPTIONS = [
    {
        "key": "electricity_price",
        "label": "Household electricity price",
        "value": 0.370,
        "unit": "€/kWh",
        "source": "BDEW Strompreisanalyse, average household price (3,500 kWh/year)",
        "source_url": "https://www.bdew.de/media/documents/BDEW_Strompreisanalyse_082026.pdf",
        "as_of": "August 2026",
    },
    {
        "key": "feed_in_tariff",
        "label": "Feed-in tariff",
        "value": 0.0770,
        "unit": "€/kWh",
        "source": "Bundesnetzagentur, EEG rate for buildings up to 10 kW with partial "
        "feed-in, systems commissioned from 1 August 2026",
        "source_url": "https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/"
        "ErneuerbareEnergien/EEG_Foerderung/start.html",
        "as_of": "August 2026",
    },
    {
        "key": "self_consumption_share",
        "label": "Share of solar power used in the household",
        "value": 0.30,
        "unit": "share",
        "source": "Verbraucherzentrale Rheinland-Pfalz: 28 % in its example household "
        "without a battery; typical values are 20–35 %",
        "source_url": "https://verbraucherzentrale-rlp.de/node/71757",
        "as_of": "March 2022",
    },
    {
        "key": "system_cost_per_kwp",
        "label": "System cost",
        "value": 1250.0,
        "unit": "€/kWp",
        "source": "42watt market overview: 1,100–1,400 €/kWp for turnkey 5–10 kWp rooftop "
        "systems without battery (0 % VAT); midpoint",
        "source_url": "https://42watt.de/magazin/photovoltaik-kosten",
        "as_of": "July 2026",
    },
    {
        "key": "grid_co2_factor",
        "label": "CO₂ per kWh of German grid electricity",
        "value": 0.344,
        "unit": "kg/kWh",
        "source": "Umweltbundesamt, emissions per kWh of electricity consumed in 2025",
        "source_url": "https://www.umweltbundesamt.de/themen/"
        "co2-emissionen-pro-kilowattstunde-strom-2025-nur",
        "as_of": "2025",
    },
]


def seed(apps, schema_editor):
    Assumption = apps.get_model("estimates", "Assumption")
    for assumption in ASSUMPTIONS:
        Assumption.objects.update_or_create(key=assumption["key"], defaults=assumption)


def unseed(apps, schema_editor):
    Assumption = apps.get_model("estimates", "Assumption")
    Assumption.objects.filter(key__in=[a["key"] for a in ASSUMPTIONS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("estimates", "0002_assumption"),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
