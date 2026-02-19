type HistoryControlsProps = {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  onResetProject: () => void;
};

export function HistoryControls({ canUndo, canRedo, undo, redo, onResetProject }: HistoryControlsProps) {
  return (
    <div className="row">
      <button
        type="button"
        onClick={onResetProject}
        className="btn btn-sm kr-control danger-btn"
      >
        Reset project
      </button>
      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        className="btn btn-sm kr-control is-disabled-when-needed"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        className="btn btn-sm kr-control is-disabled-when-needed"
      >
        Redo
      </button>
    </div>
  );
}
