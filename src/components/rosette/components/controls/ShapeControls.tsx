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
      <div className="kr-glass-inset row-between panel-card">
        <p className="small-text text-amber-soft">Per-sprite toggles</p>
        <button type="button" onClick={addSprite} className="btn btn-sm kr-control kr-neon-amber">Add sprite</button>
      </div>
      <div className="kr-glass-inset sprite-list">
        {sliceState.sprites.map((sprite, index) => {
          const isActive = sprite.id === sliceState.activeSpriteId;
          const hasAxisConstraint = getSpriteAxisConstraintMode(sprite) === "endpoints-on-axis";
          return (
            <div key={sprite.id} className={`sprite-item ${isActive ? "sprite-item-active" : ""}`}>
              <button type="button" onClick={() => setActiveSprite(sprite.id)} className="sprite-name">
                Sprite {index + 1}
              </button>
              <label className="row small-text text-zinc-soft" title="Endpoints on symmetry axis">
                axis
                <input
                  type="checkbox"
                  checked={hasAxisConstraint}
                  onChange={(event) => setSpriteAxisConstraint(sprite.id, event.target.checked)}
                  className="checkbox-sm checkbox-amber"
                />
              </label>
              <label className="row small-text text-zinc-soft">
                on
                <input
                  type="checkbox"
                  checked={sprite.enabled !== false}
                  onChange={(event) => setSpriteEnabled(sprite.id, event.target.checked)}
                  className="checkbox-sm checkbox-amber"
                />
              </label>
              <button
                type="button"
                onClick={() => removeSprite(sprite.id)}
                disabled={sliceState.sprites.length <= 1}
                className="btn btn-xs kr-control is-disabled-when-needed"
              >
                Del
              </button>
            </div>
          );
        })}
      </div>
      <div className="row-between">
        <button type="button" onClick={addHandle} className="btn btn-sm kr-control">Add handle</button>
        <button type="button" onClick={removeHandle} disabled={activeSpritePointsLength <= 2} className="btn btn-sm kr-control is-disabled-when-needed">Remove handle</button>
        <span className="small-text">handles: {activeSpritePointsLength}</span>
      </div>
    </>
  );
}
