import "maplibre-gl/dist/maplibre-gl.css";

import { Map, NavigationControl, ScaleControl } from "@vis.gl/react-maplibre";

/**
 * MapLibre decodes map tiles in a Web Worker. Version 6 builds the
 * worker's URL at runtime, which Vite cannot follow, so the worker file
 * would be missing from the build and the map would stay empty. The
 * `?worker&url` import makes Vite bundle the worker (with the code it
 * imports) and returns its final URL, passed to the map as `workerUrl`.
 */
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import { FREIBURG_CENTER, MAP_MAX_BOUNDS } from "../../lib/region";

/**
 * OpenFreeMap's "liberty" style: free vector tiles, no API key. Its
 * `building-3d` layer extrudes buildings to their OpenStreetMap height
 * from zoom 14 on, which shows once the map is tilted. The required
 * credit (OpenFreeMap, OpenMapTiles, OpenStreetMap) comes with the tiles,
 * and MapLibre's attribution button displays it automatically.
 */
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

/**
 * The interactive WebGL map, restricted to Baden-Württemberg and starting
 * over Freiburg's old town. It fills its parent, which must have a height.
 *
 * Tilt and rotate with right-drag or Ctrl+drag. The compass button resets
 * the view to north-up and flat.
 */
export function MapView() {
  return (
    <Map
      initialViewState={{ ...FREIBURG_CENTER, zoom: 16 }}
      mapStyle={MAP_STYLE}
      maxBounds={MAP_MAX_BOUNDS}
      workerUrl={maplibreWorkerUrl}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="top-right" visualizePitch />
      <ScaleControl position="bottom-left" />
    </Map>
  );
}
