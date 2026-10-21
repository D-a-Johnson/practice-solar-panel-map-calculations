import { useState } from "react";

import { type LngLat, useBuildingAt } from "./api/buildings";
import { ApiStatus } from "./components/ApiStatus";
import { MapView } from "./components/map/MapView";
import { BuildingPanel } from "./components/panel/BuildingPanel";

/**
 * Page shell: a header on top, the map filling the remaining space, and
 * the results panel on the right. Below the `md` breakpoint (768 px) the
 * panel moves underneath the map.
 */
export default function App() {
  const [picked, setPicked] = useState<LngLat | null>(null);
  const building = useBuildingAt(picked);

  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-900">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
        <img src="/favicon.svg" alt="" className="size-7" />
        <h1 className="text-lg font-semibold">Solar estimator</h1>
        <span className="text-sm text-slate-500">Baden-Württemberg</span>
        <div className="ml-auto">
          <ApiStatus />
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-rows-[1fr_auto] md:grid-cols-[1fr_24rem] md:grid-rows-1">
        <section aria-label="Map" className="relative min-h-80 bg-slate-200">
          <MapView building={building.data} onPick={setPicked} />
          {building.isFetching && (
            <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
              <p className="rounded-md bg-white/90 px-4 py-2 text-sm shadow">
                Loading building… The first click in a new area downloads LGL
                data and can take about 20 seconds.
              </p>
            </div>
          )}
        </section>

        <aside
          aria-label="Results"
          className="overflow-y-auto border-t border-slate-200 bg-white p-4 md:border-t-0 md:border-l"
        >
          <BuildingPanel picked={picked} query={building} />
        </aside>
      </main>
    </div>
  );
}
