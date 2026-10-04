/**
 * Page shell: a header on top, the map filling the remaining space, and
 * the results panel on the right. Below the `md` breakpoint (768 px) the
 * panel moves underneath the map.
 */
export default function App() {
  return (
    <div className="flex h-dvh flex-col bg-slate-50 text-slate-900">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
        <img src="/favicon.svg" alt="" className="size-7" />
        <h1 className="text-lg font-semibold">Solar estimator</h1>
        <span className="text-sm text-slate-500">Baden-Württemberg</span>
      </header>

      <main className="grid min-h-0 flex-1 grid-rows-[1fr_auto] md:grid-cols-[1fr_24rem] md:grid-rows-1">
        <section aria-label="Map" className="relative min-h-80 bg-slate-200">
          <p className="absolute inset-0 grid place-items-center text-slate-500">
            The map goes here.
          </p>
        </section>

        <aside
          aria-label="Results"
          className="overflow-y-auto border-t border-slate-200 bg-white p-4 md:border-t-0 md:border-l"
        >
          <h2 className="font-semibold">Your setup</h2>
          <p className="mt-2 text-sm text-slate-600">
            Click a building on the map to start.
          </p>
        </aside>
      </main>
    </div>
  );
}
