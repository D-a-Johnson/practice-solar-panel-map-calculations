import { useMap } from "@vis.gl/react-maplibre";
import { type KeyboardEvent, useId, useState } from "react";

import type { LngLat } from "../api/buildings";
import { labelOf, type Place, usePlaces } from "../api/places";
import { useI18n } from "../i18n/language";
import { useDebouncedValue } from "../lib/useDebouncedValue";
import { MAP_ID } from "./map/MapView";

const MIN_CHARS = 3;
const TYPING_SETTLE_MS = 300;
const BUILDING_ZOOM = 18;

/**
 * Address search following the WAI-ARIA combobox pattern: focus stays in
 * the text field while the arrow keys move a highlight through the
 * suggestions, and `aria-activedescendant` tells screen readers which one
 * is highlighted. Choosing a place moves the map there; choosing a
 * building also selects it, like a click on the map.
 */
export function AddressSearch({ onPick }: { onPick: (point: LngLat) => void }) {
  const map = useMap()[MAP_ID];
  const { t } = useI18n();
  const listId = useId();
  const [text, setText] = useState("");
  const [near, setNear] = useState<LngLat>();
  const [open, setOpen] = useState(false);
  const [activeLabel, setActiveLabel] = useState<string>();

  const query = useDebouncedValue(text.trim(), TYPING_SETTLE_MS);
  const searching = open && query.length >= MIN_CHARS;
  const places = usePlaces(searching ? { text: query, near } : null);
  const options = searching ? (places.data ?? []) : [];
  const expanded = options.length > 0;
  const activeIndex = options.findIndex(
    (place) => labelOf(place) === activeLabel,
  );

  function choose(place: Place) {
    setText(labelOf(place));
    setOpen(false);
    if (place.bounds) {
      map?.fitBounds(place.bounds, { padding: 40, maxZoom: BUILDING_ZOOM });
    } else {
      map?.flyTo({ center: place.point, zoom: BUILDING_ZOOM });
    }
    if (place.isBuilding) {
      onPick(place.point);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (expanded) {
        const step = event.key === "ArrowDown" ? 1 : -1;
        const next =
          activeIndex === -1
            ? step === 1
              ? 0
              : options.length - 1
            : (activeIndex + step + options.length) % options.length;
        setActiveLabel(labelOf(options[next]));
      }
    } else if (event.key === "Enter" && expanded) {
      event.preventDefault();
      choose(options[Math.max(activeIndex, 0)]);
    } else if (event.key === "Escape" && open) {
      /**
       * The first Escape only closes the list. Without preventDefault,
       * browsers would also clear the search field.
       */
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <search className="relative order-last w-full sm:order-none sm:max-w-md sm:flex-1">
      <input
        type="search"
        role="combobox"
        aria-label={t.search.label}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={
          activeIndex === -1 ? undefined : `${listId}-${activeIndex}`
        }
        autoComplete="off"
        placeholder={t.search.placeholder}
        value={text}
        onChange={(event) => {
          const center = map?.getCenter();
          setText(event.target.value);
          setNear(center && { lng: center.lng, lat: center.lat });
          setOpen(true);
          setActiveLabel(undefined);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm placeholder:text-slate-400 focus:border-amber-500 focus:outline-2 focus:outline-amber-500/30"
      />
      {searching && (
        <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
          {expanded ? (
            <ul
              id={listId}
              role="listbox"
              aria-label={t.search.results}
              /**
               * Keeps focus in the text field, whose blur would otherwise
               * close the list before the click on an option lands.
               */
              onMouseDown={(event) => event.preventDefault()}
            >
              {options.map((place, index) => (
                <li
                  key={labelOf(place)}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => choose(place)}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100 aria-selected:bg-amber-100"
                >
                  <span className="block font-medium">{place.title}</span>
                  <span className="block text-xs text-slate-500">
                    {place.detail}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" className="px-3 py-2 text-sm text-slate-500">
              {places.isError
                ? t.search.unavailable
                : places.isFetching
                  ? t.search.searching
                  : t.search.noMatch}
            </p>
          )}
        </div>
      )}
    </search>
  );
}
