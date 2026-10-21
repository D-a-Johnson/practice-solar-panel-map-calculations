import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

import type { Building, LngLat } from "../../api/buildings";

type BuildingPanelProps = {
  picked: LngLat | null;
  query: UseQueryResult<Building | null>;
};

export function BuildingPanel({ picked, query }: BuildingPanelProps) {
  if (!picked) {
    return <Hint>Click a building on the map to start.</Hint>;
  }
  if (query.isPending) {
    return <Hint>Loading building…</Hint>;
  }
  if (query.isError) {
    return <Hint>{query.error.message}</Hint>;
  }
  if (!query.data) {
    return <Hint>No building here. Click directly on a building.</Hint>;
  }

  const building = query.data;
  const roofs = building.surfaces.filter((surface) => surface.kind === "roof");

  return (
    <div>
      <h2 className="font-semibold">{title(building)}</h2>
      <p className="text-sm text-slate-600">
        {building.locality}
        {building.measured_height !== null &&
          ` · ${building.measured_height.toFixed(1)} m high`}
      </p>

      <h3 className="mt-4 text-sm font-semibold">
        Roof faces ({roofs.length})
      </h3>
      <ul className="mt-2 divide-y divide-slate-100 text-sm">
        {roofs.map((roof) => (
          <li key={roof.gml_id} className="flex justify-between py-1.5">
            <span>{roof.direction ?? "flat"}</span>
            <span className="text-slate-600">
              {roof.tilt.toFixed(0)}° · {roof.area.toFixed(0)} m²
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function title(building: Building): string {
  const address = `${building.street} ${building.house_number}`.trim();
  return building.name || address || "Building without address";
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-600">{children}</p>;
}
