import { Button } from "@/components/ui/button";

type HistoryControlsProps = {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  onResetProject: () => void;
};

export function HistoryControls({ canUndo, canRedo, undo, redo, onResetProject }: HistoryControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button type="button" size="sm" variant="destructive" onClick={onResetProject} className="h-7 px-2 text-[11px]">
        Reset project
      </Button>
      <Button type="button" size="sm" variant="secondary" onClick={undo} disabled={!canUndo} className="h-7 px-2 text-[11px]">
        Undo
      </Button>
      <Button type="button" size="sm" variant="secondary" onClick={redo} disabled={!canRedo} className="h-7 px-2 text-[11px]">
        Redo
      </Button>
    </div>
  );
}
