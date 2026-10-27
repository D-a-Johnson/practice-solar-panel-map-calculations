import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Written by hand: makemigrations doesn't recognise a rename together with
    other changes and would delete Surface and create an empty Roof table,
    losing every imported roof.
    """

    dependencies = [
        ("buildings", "0001_initial"),
    ]

    operations = [
        # Imports from before walls were dropped stored them with
        # kind="wall"; without this they would become Roof rows.
        migrations.RunSQL(
            "DELETE FROM buildings_surface WHERE kind = 'wall'",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RemoveField(model_name="surface", name="kind"),
        migrations.RenameModel(old_name="Surface", new_name="Roof"),
        migrations.AlterField(
            model_name="roof",
            name="building",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="roofs",
                to="buildings.building",
            ),
        ),
    ]
