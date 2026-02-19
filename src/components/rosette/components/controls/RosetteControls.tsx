import {
  MAX_LINE_THICKNESS,
  MAX_ORDER,
  MIN_LINE_THICKNESS,
  MIN_ORDER,
} from "../../constants";
import { snapOrder } from "../../math";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ControlCard, SliderField } from "./ControlPrimitives";

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
    <ControlCard>
      <SliderField
        id="order-input"
        label="Order (n)"
        valueLabel={`${order}`}
        value={order}
        min={MIN_ORDER}
        max={MAX_ORDER}
        step={1}
        onChange={(value) => setOrder(snapOrder(value))}
      />
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="mirror-adj" className="text-xs text-slate-300/80">Mirror adjacent linkages</Label>
        <Checkbox id="mirror-adj" checked={mirrorAdjacency} onCheckedChange={(checked) => setMirrorAdjacency(Boolean(checked))} />
      </div>
      <SliderField
        id="line-thickness"
        label="Line thickness"
        valueLabel={lineThickness.toFixed(1)}
        value={lineThickness}
        min={MIN_LINE_THICKNESS}
        max={MAX_LINE_THICKNESS}
        step={0.1}
        onChange={setLineThickness}
      />
    </ControlCard>
  );
}
