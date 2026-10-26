import "maplibre-gl/dist/maplibre-gl.css";

import {
  AttributionControl,
  Layer,
  Map,
  NavigationControl,
  ScaleControl,
  Source,
  type MapLayerMouseEvent,
} from "@vis.gl/react-maplibre";
import type { FeatureCollection, Geometry } from "geojson";
import { type ReactNode, useMemo, useState } from "react";

/**
 * MapLibre decodes map tiles in a Web Worker. Version 6 builds the
 * worker's URL at runtime, which Vite cannot follow, so the worker file
 * would be missing from the build and the map would stay empty. The
 * `?worker&url` import makes Vite bundle the worker (with the code it
 * imports) and returns its final URL, passed to the map as `workerUrl`.
 */
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import { type Building, type LngLat, roofsOf } from "../../api/buildings";
import { FREIBURG_CENTER, MAP_MAX_BOUNDS } from "../../lib/region";
import { pointInside, type XY } from "../../lib/pointInside";
import { canRenderWebGL2 } from "../../lib/webgl";

/**
 * OpenFreeMap's "liberty" style: free vector tiles, no API key. Its
 * `building-3d` layer extrudes buildings to their OpenStreetMap height
 * from zoom 14 on, which shows once the map is tilted. The required
 * credit (OpenFreeMap, OpenMapTiles, OpenStreetMap) comes with the tiles,
 * and MapLibre's attribution button displays it automatically.
 */
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/**
 * The selected building's footprint and roof faces come from LGL's LoD2
 * data, whose licence (dl-de/by-2-0) requires this credit wherever the data
 * is shown.
 */
const LGL_ATTRIBUTION =
  "LGL-BW (2026) " +
  '<a href="https://www.govdata.de/dl-de/by-2-0" target="_blank" rel="noreferrer">' +
  "Datenlizenz Deutschland – Namensnennung – Version 2.0</a>, " +
  '<a href="https://www.lgl-bw.de" target="_blank" rel="noreferrer">www.lgl-bw.de</a>';

/**
 * Lets components outside the map, such as the address search, reach it
 * through `useMap()`.
 */
export const MAP_ID = "solar";

const NO_FEATURES: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

type MapViewProps = {
  building: Building | null | undefined;
  selectedFaceId: string | null;
  onPick: (point: LngLat) => void;
};

export function MapView({ building, selectedFaceId, onPick }: MapViewProps) {
  const selection = useMemo(
    () => (building ? toFeatures(building, selectedFaceId) : NO_FEATURES),
    [building, selectedFaceId],
  );

  const [webglAvailable] = useState(canRenderWebGL2);
  const [styleFailed, setStyleFailed] = useState(false);

  if (!webglAvailable) {
    return (
      <MapMessage>
        This browser can't display the map because WebGL 2 is unavailable. Try
        another browser, or turn on hardware acceleration in the browser
        settings.
      </MapMessage>
    );
  }

  return (
    <>
      <Map
        id={MAP_ID}
        initialViewState={{ ...FREIBURG_CENTER, zoom: 16 }}
        mapStyle={MAP_STYLE}
        maxBounds={MAP_MAX_BOUNDS}
        workerUrl={maplibreWorkerUrl}
        cursor="pointer"
        attributionControl={false}
        onError={(event) => {
          if (!event.target.isStyleLoaded()) {
            setStyleFailed(true);
          }
        }}
        onClick={(event: MapLayerMouseEvent) => onPick(pickedPoint(event))}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" visualizePitch />
        <ScaleControl position="bottom-left" />
        <AttributionControl
          position="bottom-right"
          customAttribution={LGL_ATTRIBUTION}
        />
        <Source id="selection" type="geojson" data={selection}>
          <Layer
            id="selection-roofs"
            type="fill"
            filter={["==", ["get", "kind"], "roof"]}
            paint={{
              "fill-color": ["case", ["get", "selected"], "#c2410c", "#f59e0b"],
              "fill-opacity": ["case", ["get", "selected"], 0.8, 0.45],
            }}
          />
          <Layer
            id="selection-outline"
            type="line"
            filter={["==", ["get", "kind"], "footprint"]}
            paint={{ "line-color": "#b45309", "line-width": 3 }}
          />
        </Source>
      </Map>
      {styleFailed && (
        <MapMessage>
          The map couldn't load. Check your internet connection and reload the
          page.
        </MapMessage>
      )}
    </>
  );
}

function MapMessage({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="absolute inset-0 grid place-items-center bg-slate-200 p-6 text-center text-sm text-slate-700"
    >
      <p className="max-w-sm">{children}</p>
    </div>
  );
}

/**
 * On a tilted map MapLibre turns a click into the point on the ground under
 * the cursor, which lies behind the 3D building the user aimed at. The
 * extruded OpenStreetMap building under the cursor is the real target, so a
 * point inside its outline is used instead. Looking straight down, the
 * ground point is already right.
 */
function pickedPoint(event: MapLayerMouseEvent): LngLat {
  const map = event.target;
  const ground = { lng: event.lngLat.lng, lat: event.lngLat.lat };
  if (map.getPitch() === 0) {
    return ground;
  }
  const [building] = map.queryRenderedFeatures(event.point, {
    layers: ["building-3d"],
  });
  const ring = building && outerRing(building.geometry);
  if (!ring) {
    return ground;
  }
  const [lng, lat] = pointInside(ring);
  return { lng, lat };
}

function outerRing(geometry: Geometry): XY[] | undefined {
  if (geometry.type === "Polygon") {
    return geometry.coordinates[0] as XY[];
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates[0]?.[0] as XY[] | undefined;
  }
  return undefined;
}

function toFeatures(
  building: Building,
  selectedFaceId: string | null,
): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: building.footprint,
        properties: { kind: "footprint" },
      },
      ...roofsOf(building).map((roof) => ({
        type: "Feature" as const,
        geometry: roof.geometry,
        properties: { kind: "roof", selected: roof.gml_id === selectedFaceId },
      })),
    ],
  };
}
