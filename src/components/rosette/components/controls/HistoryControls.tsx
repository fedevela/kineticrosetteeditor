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
      <button
        type="button"
        onClick={onResetProject}
        className="rounded border border-rose-500/70 px-2 py-1 text-xs text-rose-200 transition-colors hover:bg-rose-900/40"
      >
        Reset project
      </button>
      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Redo
      </button>
    </div>
  );
}
