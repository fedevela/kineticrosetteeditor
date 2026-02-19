import { RosetteControlsPanel } from "./rosette/components/RosetteControlsPanel";
import { EditingBadge } from "./rosette/components/EditingBadge";
import { RosetteCanvas } from "./rosette/components/RosetteCanvas";
import { useContainerSize } from "./rosette/hooks/useContainerSize";

export function RosetteMechanism() {
  const { containerRef, size } = useContainerSize();

  return (
    <div ref={containerRef} className="rosette-root">
      <RosetteControlsPanel />
      <EditingBadge />
      <RosetteCanvas size={size} />
    </div>
  );
}
