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
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-slate-900/65 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_8px_28px_rgba(2,6,23,0.35)] backdrop-blur-md">
      <p className="text-[11px] text-amber-100">Active sprite context (Bezier.js)</p>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={addHandle} className="rounded-md border border-white/10 bg-slate-800/70 px-2 py-1 text-[11px] text-slate-100 transition hover:border-white/20 hover:bg-slate-700/70">Add control point</button>
        <button type="button" onClick={removeHandle} disabled={activeSpritePointsLength <= 2} className="rounded-md border border-white/10 bg-slate-800/70 px-2 py-1 text-[11px] text-slate-100 transition hover:border-white/20 hover:bg-slate-700/70 disabled:cursor-not-allowed disabled:opacity-40">Remove control point</button>
      </div>
      <p className="text-[11px] text-zinc-300">Tip: Alt + click a curve to insert a point on segment.</p>
      <div className="flex items-center justify-between gap-2"><label className="text-xs text-slate-300/80">Curve mode</label><span className="text-xs text-slate-100">Cubic</span></div>
      <div className="flex items-center justify-between gap-2"><label className="text-xs text-slate-300/80">Bezier LUT</label><span className="text-xs text-slate-100">{bezier.lutSteps}</span></div>
      <input type="range" min={8} max={160} step={1} value={bezier.lutSteps} onChange={(event) => updateSpriteBezier(sprite.id, { lutSteps: Number(event.target.value) })} className="w-full accent-amber-500" />
      <div className="flex items-center justify-between gap-2"><label className="text-xs text-slate-300/80">Bezier offset</label><span className="text-xs text-slate-100">{bezier.offset.toFixed(0)}</span></div>
      <input type="range" min={-80} max={80} step={1} value={bezier.offset} onChange={(event) => updateSpriteBezier(sprite.id, { offset: Number(event.target.value) })} className="w-full accent-amber-500" />
      <div className="flex items-center justify-between gap-2"><label className="text-xs text-slate-300/80">Sprite rotate</label><span className="text-xs text-slate-100">{transform.rotationDeg.toFixed(0)}°</span></div>
      <input type="range" min={-180} max={180} step={1} value={transform.rotationDeg} onChange={(event) => updateSpriteTransform(sprite.id, { rotationDeg: Number(event.target.value) })} className="w-full accent-amber-500" />
      <div className="flex items-center justify-between gap-2"><label className="text-xs text-slate-300/80">Sprite scale</label><span className="text-xs text-slate-100">{transform.scale.toFixed(2)}</span></div>
      <input type="range" min={0.2} max={3} step={0.01} value={transform.scale} onChange={(event) => updateSpriteTransform(sprite.id, { scale: Number(event.target.value) })} className="w-full accent-amber-500" />
    </div>
  );
}