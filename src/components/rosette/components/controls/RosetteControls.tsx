import {
  MAX_LINE_THICKNESS,
  MAX_ORDER,
  MIN_LINE_THICKNESS,
  MIN_ORDER,
} from "../../constants";
import { snapOrder } from "../../math";

type RosetteControlsProps = {
  order: number;
  setOrder: (value: number) => void;
  mirrorAdjacency: boolean;
  setMirrorAdjacency: (value: boolean) => void;
  lineThickness: number;
  setLineThickness: (value: number) => void;
};

export function RosetteControls({
  order,
  setOrder,
  mirrorAdjacency,
  setMirrorAdjacency,
  lineThickness,
  setLineThickness,
}: RosetteControlsProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-slate-900/65 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_8px_28px_rgba(2,6,23,0.35)] backdrop-blur-md">
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label htmlFor="order-input" className="text-xs text-slate-300/80">Order (n)</label>
          <span className="text-xs tabular-nums text-slate-100">{order}</span>
        </div>
        <input id="order-input" type="range" min={MIN_ORDER} max={MAX_ORDER} step={1} value={order} onChange={(event) => setOrder(snapOrder(Number(event.target.value)))} className="w-full accent-cyan-400" aria-label="Rosette order" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="mirror-adj" className="text-xs text-slate-300/80">Mirror adjacent linkages</label>
        <input id="mirror-adj" type="checkbox" checked={mirrorAdjacency} onChange={(event) => setMirrorAdjacency(event.target.checked)} className="h-4 w-4 accent-cyan-400" />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label htmlFor="line-thickness" className="text-xs text-slate-300/80">Line thickness</label>
          <span className="text-xs tabular-nums text-slate-100">{lineThickness.toFixed(1)}</span>
        </div>
        <input id="line-thickness" type="range" min={MIN_LINE_THICKNESS} max={MAX_LINE_THICKNESS} step={0.1} value={lineThickness} onChange={(event) => setLineThickness(Number(event.target.value))} className="w-full accent-cyan-400" aria-label="Rosette line thickness" />
      </div>
    </div>
  );
}
