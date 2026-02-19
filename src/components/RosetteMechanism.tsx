import { Suspense, lazy } from "react";
import { RosetteControlsPanel } from "./rosette/components/RosetteControlsPanel";
import { EditingBadge } from "./rosette/components/EditingBadge";
import { useContainerSize } from "./rosette/hooks/useContainerSize";

const RosetteCanvas = lazy(async () => {
  const module = await import("./rosette/components/RosetteCanvas");
  return { default: module.RosetteCanvas };
});

export function RosetteMechanism() {
  const { containerRef, size } = useContainerSize();

  return (
    <div ref={containerRef} className="rosette-root">
      <RosetteControlsPanel />
      <EditingBadge />
      <Suspense
        fallback={
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-xs text-slate-300/80">
            Loading canvas…
          </div>
        }
      >
        <RosetteCanvas size={size} />
      </Suspense>
    </div>
  );
}
