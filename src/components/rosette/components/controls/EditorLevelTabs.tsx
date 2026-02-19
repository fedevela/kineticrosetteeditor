import { LEVEL_META } from "../../constants";
import { EditorLevel } from "../../types";

type EditorLevelTabsProps = {
  editorLevel: EditorLevel;
  setEditorLevel: (level: EditorLevel) => void;
};

export function EditorLevelTabs({ editorLevel, setEditorLevel }: EditorLevelTabsProps) {
  return (
    <div className="kr-glass-inset panel-card">
      <div className="tabs-grid">
        {(Object.keys(LEVEL_META) as EditorLevel[]).map((level) => {
          const levelMeta = LEVEL_META[level];
          const isActive = editorLevel === level;

          return (
            <button
              key={level}
              type="button"
              onClick={() => setEditorLevel(level)}
              className={`btn ${
                isActive
                  ? `${levelMeta.buttonClass} ${levelMeta.neonClass}`
                  : "kr-control"
              }`}
            >
              {levelMeta.shortTitle}
            </button>
          );
        })}
      </div>
    </div>
  );
}
