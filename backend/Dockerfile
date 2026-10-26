# Two stages: uv only builds the virtual environment, and the final image
# gets the environment without uv or its download cache.
FROM python:3.14.9-slim-trixie AS build

COPY --from=ghcr.io/astral-sh/uv:0.13.3 /uv /bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=never
WORKDIR /app

# Only the lock file and pyproject.toml go into this layer, so code changes
# don't reinstall the dependencies.
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-dev --no-install-project


FROM python:3.14.9-slim-trixie

# GeoDjango loads GDAL and GEOS at runtime; libgdal36 brings GEOS and PROJ.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgdal36 \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1
WORKDIR /app

COPY --from=build /app/.venv .venv
COPY . .

# collectstatic loads the settings, which require these variables. The
# values are placeholders and never reach the running app.
RUN DJANGO_SECRET_KEY=build POSTGRES_DB=build POSTGRES_USER=build POSTGRES_PASSWORD=build \
    python manage.py collectstatic --noinput

# The tile cache folder must exist and belong to the app user before a
# volume is mounted on it, so the volume inherits that owner.
RUN useradd --system app && mkdir -p data/lod2 && chown app data/lod2
USER app

EXPOSE 8000

# Threads let a worker answer other requests while one waits for LGL or
# PVGIS. With threads, gunicorn's 30 s worker timeout also stops applying
# to single requests, so slow first-click tile imports aren't cut off.
# The control socket only serves the gunicornc tool; here the container
# platform starts and stops the server.
CMD ["gunicorn", "config.wsgi", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4", "--no-control-socket"]
