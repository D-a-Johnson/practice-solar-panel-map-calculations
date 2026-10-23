import type { ReactNode } from "react";

export function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-sm text-slate-600">{children}</p>;
}
