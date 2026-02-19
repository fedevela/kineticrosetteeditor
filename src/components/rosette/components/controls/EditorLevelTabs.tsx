import { LEVEL_META } from "../../constants";
import { EditorLevel } from "../../types";

type EditorLevelTabsProps = {
  editorLevel: EditorLevel;
  setEditorLevel: (level: EditorLevel) => void;
};

export function EditorLevelTabs({ editorLevel, setEditorLevel }: EditorLevelTabsProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/65 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_8px_28px_rgba(2,6,23,0.35)] backdrop-blur-md">
      <div className="grid grid-cols-3 gap-1">
        {(Object.keys(LEVEL_META) as EditorLevel[]).map((level) => {
          const levelMeta = LEVEL_META[level];
          const isActive = editorLevel === level;

          return (
            <button
              key={level}
              type="button"
              onClick={() => setEditorLevel(level)}
              className={`rounded-md border px-2 py-1.5 text-xs transition ${
                isActive
                  ? `${levelMeta.buttonClass} ${levelMeta.neonClass}`
                  : "border-white/10 bg-slate-800/70 text-slate-100 hover:border-white/20 hover:bg-slate-700/70"
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
