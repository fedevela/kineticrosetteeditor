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
    <div className="kr-glass-inset control-stack panel-card">
      <div>
        <div className="row-between control-label-row">
          <label htmlFor="order-input">Order (n)</label>
          <span className="tabular-nums">{order}</span>
        </div>
        <input id="order-input" type="range" min={MIN_ORDER} max={MAX_ORDER} step={1} value={order} onChange={(event) => setOrder(snapOrder(Number(event.target.value)))} className="range-input checkbox-cyan" aria-label="Rosette order" />
      </div>
      <div className="row-between">
        <label htmlFor="mirror-adj" className="control-label">Mirror adjacent linkages</label>
        <input id="mirror-adj" type="checkbox" checked={mirrorAdjacency} onChange={(event) => setMirrorAdjacency(event.target.checked)} className="checkbox-md checkbox-cyan" />
      </div>
      <div>
        <div className="row-between control-label-row">
          <label htmlFor="line-thickness">Line thickness</label>
          <span className="tabular-nums">{lineThickness.toFixed(1)}</span>
        </div>
        <input id="line-thickness" type="range" min={MIN_LINE_THICKNESS} max={MAX_LINE_THICKNESS} step={0.1} value={lineThickness} onChange={(event) => setLineThickness(Number(event.target.value))} className="range-input checkbox-cyan" aria-label="Rosette line thickness" />
      </div>
    </div>
  );
}
