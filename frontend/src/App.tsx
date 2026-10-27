import { MapProvider } from "@vis.gl/react-maplibre";
import { useState } from "react";

import { type LngLat, useBuildingAt } from "./api/buildings";
import { AddressSearch } from "./components/AddressSearch";
import { ApiStatus } from "./components/ApiStatus";
import { AssumptionsProvider } from "./components/AssumptionsProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MapView } from "./components/map/MapView";
import { LanguageSwitch } from "./components/LanguageSwitch";
import { BuildingPanel } from "./components/panel/BuildingPanel";
import { Hint } from "./components/panel/Hint";
import { useI18n } from "./i18n/language";

/**
 * Page shell: a header on top, the map filling the remaining space, and
 * the results panel on the right. Below the `md` breakpoint (768 px) the
 * panel moves underneath the map.
 */
export default function App() {
  const [picked, setPicked] = useState<LngLat | null>(null);
  const [chosenFaceId, setChosenFaceId] = useState<string | null>(null);
  const { t } = useI18n();
  const building = useBuildingAt(picked);

  const largestRoofId = building.data
    ? building.data.roofs[0]?.gml_id
    : undefined;
  const selectedFaceId = chosenFaceId ?? largestRoofId ?? null;

  function pick(point: LngLat) {
    setPicked(point);
    setChosenFaceId(null);
  }

  return (
    <AssumptionsProvider>
      <MapProvider>
        <div className="flex h-dvh flex-col bg-slate-50 text-slate-900">
          <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-4 py-2">
            <img src="/favicon.svg" alt="" className="size-7" />
            <h1 className="text-lg font-semibold">{t.title}</h1>
            <span className="hidden text-sm text-slate-500 sm:inline">
              Baden-Württemberg
            </span>
            <AddressSearch onPick={pick} />
            <div className="ml-auto flex items-center gap-4">
              <LanguageSwitch />
              <ApiStatus />
            </div>
          </header>

          <main className="grid min-h-0 flex-1 grid-rows-[1fr_auto] md:grid-cols-[1fr_24rem] md:grid-rows-1">
            <div className="relative min-h-80 bg-slate-200">
              <MapView
                building={building.data}
                selectedFaceId={selectedFaceId}
                onPick={pick}
              />
              {building.isFetching && (
                <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
                  <p className="rounded-md bg-white/90 px-4 py-2 text-sm shadow">
                    {t.loadingBuilding}
                  </p>
                </div>
              )}
            </div>

            <aside
              aria-label={t.results}
              className="overflow-y-auto border-t border-slate-200 bg-white p-4 md:border-t-0 md:border-l"
            >
              {/**
               * A new key for every picked point gives the panel a fresh
               * boundary, so choosing another building recovers from an
               * error while the map keeps working.
               */}
              <ErrorBoundary
                key={JSON.stringify(picked)}
                fallback={<Hint>{t.crash.building}</Hint>}
              >
                <BuildingPanel
                  picked={picked}
                  query={building}
                  selectedFaceId={selectedFaceId}
                  onSelectFace={setChosenFaceId}
                />
              </ErrorBoundary>
            </aside>
          </main>
        </div>
      </MapProvider>
    </AssumptionsProvider>
  );
}
