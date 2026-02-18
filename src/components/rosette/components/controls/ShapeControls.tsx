import { getSpriteAxisConstraintMode } from "../../domains/sprite";
import { SliceState } from "../../types";

type ShapeControlsProps = {
  sliceState: SliceState;
  activeSpritePointsLength: number;
  setActiveSprite: (spriteId: string) => void;
  setSpriteEnabled: (spriteId: string, enabled: boolean) => void;
  setSpriteAxisConstraint: (spriteId: string, enabled: boolean) => void;
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
  setSpriteAxisConstraint,
  addSprite,
  removeSprite,
  addHandle,
  removeHandle,
}: ShapeControlsProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5">
        <p className="text-xs text-amber-100">Per-sprite toggles</p>
        <button type="button" onClick={addSprite} className="rounded border border-amber-300/60 px-2 py-1 text-[11px] text-amber-100 hover:bg-amber-500/20">Add sprite</button>
      </div>
      <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-zinc-700/70 bg-zinc-950/40 p-1.5">
        {sliceState.sprites.map((sprite, index) => {
          const isActive = sprite.id === sliceState.activeSpriteId;
          const hasAxisConstraint = getSpriteAxisConstraintMode(sprite) === "endpoints-on-axis";
          return (
            <div key={sprite.id} className={`flex items-center justify-between gap-2 rounded px-2 py-1 ${isActive ? "bg-amber-500/20" : "bg-zinc-900/60"}`}>
              <button type="button" onClick={() => setActiveSprite(sprite.id)} className="flex-1 text-left text-xs text-zinc-200">
                Sprite {index + 1}
              </button>
              <label className="flex items-center gap-1 text-[10px] text-zinc-300" title="Endpoints on symmetry axis">
                axis
                <input
                  type="checkbox"
                  checked={hasAxisConstraint}
                  onChange={(event) => setSpriteAxisConstraint(sprite.id, event.target.checked)}
                  className="h-3.5 w-3.5 accent-amber-400"
                />
              </label>
              <label className="flex items-center gap-1 text-[11px] text-zinc-300">
                on
                <input
                  type="checkbox"
                  checked={sprite.enabled !== false}
                  onChange={(event) => setSpriteEnabled(sprite.id, event.target.checked)}
                  className="h-3.5 w-3.5 accent-amber-400"
                />
              </label>
              <button
                type="button"
                onClick={() => removeSprite(sprite.id)}
                disabled={sliceState.sprites.length <= 1}
                className="rounded border border-zinc-600 px-1.5 py-0.5 text-[11px] text-zinc-200 disabled:opacity-40"
              >
                Del
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={addHandle} className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800">Add handle</button>
        <button type="button" onClick={removeHandle} disabled={activeSpritePointsLength <= 2} className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">Remove handle</button>
        <span className="text-xs text-zinc-400">handles: {activeSpritePointsLength}</span>
      </div>
    </>
  );
}
