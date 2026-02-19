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
        className="rounded-md border border-rose-400/70 bg-slate-800/70 px-2 py-1 text-[11px] text-rose-200 transition hover:bg-rose-900/40"
      >
        Reset project
      </button>
      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        className="rounded-md border border-white/10 bg-slate-800/70 px-2 py-1 text-[11px] text-slate-100 transition hover:border-white/20 hover:bg-slate-700/70 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        className="rounded-md border border-white/10 bg-slate-800/70 px-2 py-1 text-[11px] text-slate-100 transition hover:border-white/20 hover:bg-slate-700/70 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Redo
      </button>
    </div>
  );
}
