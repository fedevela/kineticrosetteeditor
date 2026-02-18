import { LEVEL_META } from "../../constants";
import { EditorLevel } from "../../types";

type EditorLevelTabsProps = {
  editorLevel: EditorLevel;
  setEditorLevel: (level: EditorLevel) => void;
};

export function EditorLevelTabs({ editorLevel, setEditorLevel }: EditorLevelTabsProps) {
  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-950/50 p-1">
      <div className="grid grid-cols-3 gap-1">
        {(Object.keys(LEVEL_META) as EditorLevel[]).map((level) => {
          const levelMeta = LEVEL_META[level];
          const isActive = editorLevel === level;

          return (
            <button
              key={level}
              type="button"
              onClick={() => setEditorLevel(level)}
              className={`rounded border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                isActive
                  ? levelMeta.buttonClass
                  : "border-zinc-700 bg-zinc-900/70 text-zinc-300 hover:border-zinc-500"
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
