import type { ReactNode } from "react";
import { Surface } from "../../components";

export type Backdrop = "dialog" | "screen";

/** One component: title + where it comes from + its states, on a dialog surface or straight on the screen background. */
export function Story({ title, source, children, backdrop }: { title: string; source?: string; children: ReactNode; backdrop: Backdrop }) {
  const body = <div className="flex flex-wrap items-start gap-4">{children}</div>;
  return (
    <section className="flex flex-col gap-2" aria-label={title}>
      <h3 className="m-0 flex items-baseline gap-2 font-heading text-lg font-semibold text-screen-state text-shadow-game">
        {title}
        {source && <span className="font-body text-xs font-normal text-screen-text/70">{source}</span>}
      </h3>
      {backdrop === "dialog" ? (
        <Surface className="bevel-raised p-5">{body}</Surface>
      ) : (
        <div className="bg-black/45 p-5 text-tone-text text-shadow-game">{body}</div>
      )}
    </section>
  );
}
