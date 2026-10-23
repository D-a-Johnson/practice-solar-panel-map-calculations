import "maplibre-gl/dist/maplibre-gl.css";

import {
  Layer,
  Map,
  NavigationControl,
  ScaleControl,
  Source,
  type MapLayerMouseEvent,
} from "@vis.gl/react-maplibre";
import type { FeatureCollection } from "geojson";
import { useMemo } from "react";

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

/**
 * OpenFreeMap's "liberty" style: free vector tiles, no API key. Its
 * `building-3d` layer extrudes buildings to their OpenStreetMap height
 * from zoom 14 on, which shows once the map is tilted. The required
 * credit (OpenFreeMap, OpenMapTiles, OpenStreetMap) comes with the tiles,
 * and MapLibre's attribution button displays it automatically.
 */
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

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

  return (
    <Map
      initialViewState={{ ...FREIBURG_CENTER, zoom: 16 }}
      mapStyle={MAP_STYLE}
      maxBounds={MAP_MAX_BOUNDS}
      workerUrl={maplibreWorkerUrl}
      cursor="pointer"
      onClick={(event: MapLayerMouseEvent) => onPick(event.lngLat)}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="top-right" visualizePitch />
      <ScaleControl position="bottom-left" />
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
  );
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
