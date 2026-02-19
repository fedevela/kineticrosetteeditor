import { SliceState } from "../../types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ControlCard } from "./ControlPrimitives";

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
      <ControlCard className="flex-row items-center justify-between">
        <p className="text-[11px] text-amber-100">Per-sprite toggles</p>
        <Button
          type="button"
          size="sm"
          onClick={addSprite}
          className="h-7 border border-amber-300/70 bg-amber-500/15 px-2 text-[11px] text-amber-200 hover:bg-amber-500/25"
        >
          Add sprite
        </Button>
      </ControlCard>
      <ControlCard className="gap-0 p-1.5">
        <ScrollArea className="max-h-40">
          <div className="flex flex-col gap-1">
            {sliceState.sprites.map((sprite, index) => {
              const isActive = sprite.id === sliceState.activeSpriteId;
              return (
                <div key={sprite.id} className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 ${isActive ? "bg-amber-500/20 shadow-[0_0_18px_rgba(255,207,77,0.18)]" : "bg-zinc-900/60"}`}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveSprite(sprite.id)}
                    className="h-auto flex-1 justify-start p-0 text-xs text-zinc-200 hover:bg-transparent hover:text-zinc-100"
                  >
                    Sprite {index + 1}
                  </Button>
                  <label className="flex items-center gap-2 text-[11px] text-zinc-300">
                    on
                    <Checkbox
                      checked={sprite.enabled !== false}
                      onCheckedChange={(checked) => setSpriteEnabled(sprite.id, Boolean(checked))}
                      className="h-3.5 w-3.5"
                    />
                  </label>
                  <Button
                    type="button"
                    onClick={() => removeSprite(sprite.id)}
                    disabled={sliceState.sprites.length <= 1}
                    size="sm"
                    variant="secondary"
                    className="h-6 px-1.5 text-[11px]"
                  >
                    Del
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </ControlCard>
      <div className="flex items-center justify-between gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={addHandle} className="h-7 px-2 text-[11px]">
          Add control point
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={removeHandle}
          disabled={activeSpritePointsLength <= 2}
          className="h-7 px-2 text-[11px]"
        >
          Remove control point
        </Button>
        <span className="text-[11px] text-slate-300/80">handles: {activeSpritePointsLength}</span>
      </div>
    </>
  );
}
