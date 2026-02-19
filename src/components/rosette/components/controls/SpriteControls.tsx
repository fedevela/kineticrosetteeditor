import { Sprite } from "../../types";
import { Button } from "@/components/ui/button";
import { ControlCard, SliderField } from "./ControlPrimitives";

type SpriteControlsProps = {
  sprite: Sprite | null;
  activeSpritePointsLength: number;
  updateSpriteTransform: (spriteId: string, patch: { x?: number; y?: number; rotationDeg?: number; scale?: number }) => void;
  updateSpriteBezier: (spriteId: string, patch: { mode?: "cubic"; t?: number; lutSteps?: number; offset?: number; scale?: number }) => void;
  addHandle: () => void;
  removeHandle: () => void;
};

export function SpriteControls({
  sprite,
  activeSpritePointsLength,
  updateSpriteTransform,
  updateSpriteBezier,
  addHandle,
  removeHandle,
}: SpriteControlsProps) {
  if (!sprite) return null;
  const transform = sprite.transform ?? { x: 0, y: 0, rotationDeg: 0, scale: 1 };
  const bezier = sprite.bezierContext ?? { mode: "cubic" as const, t: 0.5, lutSteps: 48, offset: 0, scale: 1 };

  return (
    <ControlCard>
      <p className="text-[11px] text-amber-100">Active sprite context (Bezier.js)</p>
      <div className="flex items-center justify-between gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={addHandle} className="h-7 px-2 text-[11px]">Add control point</Button>
        <Button type="button" size="sm" variant="secondary" onClick={removeHandle} disabled={activeSpritePointsLength <= 2} className="h-7 px-2 text-[11px]">Remove control point</Button>
      </div>
      <p className="text-[11px] text-zinc-300">Tip: Alt + click a curve to insert a point on segment.</p>
      <div className="flex items-center justify-between gap-2"><label className="text-xs text-slate-300/80">Curve mode</label><span className="text-xs text-slate-100">Cubic</span></div>
      <SliderField id="bezier-lut" label="Bezier LUT" valueLabel={`${bezier.lutSteps}`} value={bezier.lutSteps} min={8} max={160} step={1} onChange={(value) => updateSpriteBezier(sprite.id, { lutSteps: value })} />
      <SliderField id="bezier-offset" label="Bezier offset" valueLabel={bezier.offset.toFixed(0)} value={bezier.offset} min={-80} max={80} step={1} onChange={(value) => updateSpriteBezier(sprite.id, { offset: value })} />
      <SliderField id="sprite-rotate" label="Sprite rotate" valueLabel={`${transform.rotationDeg.toFixed(0)}°`} value={transform.rotationDeg} min={-180} max={180} step={1} onChange={(value) => updateSpriteTransform(sprite.id, { rotationDeg: value })} />
      <SliderField id="sprite-scale" label="Sprite scale" valueLabel={transform.scale.toFixed(2)} value={transform.scale} min={0.2} max={3} step={0.01} onChange={(value) => updateSpriteTransform(sprite.id, { scale: value })} />
    </ControlCard>
  );
}