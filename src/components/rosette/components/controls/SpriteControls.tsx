import { Sprite } from "../../types";

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
    <div className="kr-glass-inset control-stack panel-card">
      <p className="small-text text-amber-soft">Active sprite context (Bezier.js)</p>
      <div className="row-between">
        <button type="button" onClick={addHandle} className="btn btn-sm kr-control">Add control point</button>
        <button type="button" onClick={removeHandle} disabled={activeSpritePointsLength <= 2} className="btn btn-sm kr-control is-disabled-when-needed">Remove control point</button>
      </div>
      <p className="small-text text-zinc-soft">Tip: Alt + click a curve to insert a point on segment.</p>
      <div className="row-between"><label>Curve mode</label><span>Cubic</span></div>
      <div className="row-between"><label>Bezier LUT</label><span>{bezier.lutSteps}</span></div>
      <input type="range" min={8} max={160} step={1} value={bezier.lutSteps} onChange={(event) => updateSpriteBezier(sprite.id, { lutSteps: Number(event.target.value) })} className="range-input checkbox-amber" />
      <div className="row-between"><label>Bezier offset</label><span>{bezier.offset.toFixed(0)}</span></div>
      <input type="range" min={-80} max={80} step={1} value={bezier.offset} onChange={(event) => updateSpriteBezier(sprite.id, { offset: Number(event.target.value) })} className="range-input checkbox-amber" />
      <div className="row-between"><label>Sprite rotate</label><span>{transform.rotationDeg.toFixed(0)}°</span></div>
      <input type="range" min={-180} max={180} step={1} value={transform.rotationDeg} onChange={(event) => updateSpriteTransform(sprite.id, { rotationDeg: Number(event.target.value) })} className="range-input checkbox-amber" />
      <div className="row-between"><label>Sprite scale</label><span>{transform.scale.toFixed(2)}</span></div>
      <input type="range" min={0.2} max={3} step={0.01} value={transform.scale} onChange={(event) => updateSpriteTransform(sprite.id, { scale: Number(event.target.value) })} className="range-input checkbox-amber" />
    </div>
  );
}