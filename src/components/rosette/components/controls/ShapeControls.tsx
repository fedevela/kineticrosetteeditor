import { SliceState } from "../../types";

type ShapeControlsProps = {
  sliceState: SliceState;
  activeSpritePointsLength: number;
  setActiveSprite: (spriteId: string) => void;
  setSpriteEnabled: (spriteId: string, enabled: boolean) => void;
  addSprite: () => void;
  removeSprite: (spriteId: string) => void;
  addHandle: () => void;
  removeHandle: () => void;
};

export function ShapeControls({
  sliceState,
  activeSpritePointsLength,
  setActiveSprite,
  setSpriteEnabled,
  addSprite,
  removeSprite,
  addHandle,
  removeHandle,
}: ShapeControlsProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-slate-900/65 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_8px_28px_rgba(2,6,23,0.35)] backdrop-blur-md">
        <p className="text-[11px] text-amber-100">Per-sprite toggles</p>
        <button type="button" onClick={addSprite} className="rounded-md border border-amber-300/70 bg-amber-500/15 px-2 py-1 text-[11px] text-amber-200 transition hover:bg-amber-500/25">Add sprite</button>
      </div>
      <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-white/10 bg-slate-900/65 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_8px_28px_rgba(2,6,23,0.35)] backdrop-blur-md">
        {sliceState.sprites.map((sprite, index) => {
          const isActive = sprite.id === sliceState.activeSpriteId;
          return (
            <div key={sprite.id} className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 ${isActive ? "bg-amber-500/20 shadow-[0_0_18px_rgba(255,207,77,0.18)]" : "bg-zinc-900/60"}`}>
              <button type="button" onClick={() => setActiveSprite(sprite.id)} className="flex-1 text-left text-xs text-zinc-200">
                Sprite {index + 1}
              </button>
              <label className="flex items-center gap-2 text-[11px] text-zinc-300">
                on
                <input
                  type="checkbox"
                  checked={sprite.enabled !== false}
                  onChange={(event) => setSpriteEnabled(sprite.id, event.target.checked)}
                  className="h-3.5 w-3.5 accent-amber-500"
                />
              </label>
              <button
                type="button"
                onClick={() => removeSprite(sprite.id)}
                disabled={sliceState.sprites.length <= 1}
                className="rounded-md border border-white/10 bg-slate-800/70 px-1.5 py-1 text-[11px] text-slate-100 transition hover:border-white/20 hover:bg-slate-700/70 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Del
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={addHandle} className="rounded-md border border-white/10 bg-slate-800/70 px-2 py-1 text-[11px] text-slate-100 transition hover:border-white/20 hover:bg-slate-700/70">Add control point</button>
        <button type="button" onClick={removeHandle} disabled={activeSpritePointsLength <= 2} className="rounded-md border border-white/10 bg-slate-800/70 px-2 py-1 text-[11px] text-slate-100 transition hover:border-white/20 hover:bg-slate-700/70 disabled:cursor-not-allowed disabled:opacity-40">Remove control point</button>
        <span className="text-[11px] text-slate-300/80">handles: {activeSpritePointsLength}</span>
      </div>
    </>
  );
}
