import { LEVEL_META } from "../constants";
import { useEditorState } from "../state/editorStore";

export function EditingBadge() {
  const { editorLevel } = useEditorState();
  const activeMeta = LEVEL_META[editorLevel];
  return (
    <div className="pointer-events-none absolute right-4 top-4 z-10">
      <div className={`rounded-md border border-white/10 bg-slate-900/70 px-3 py-1.5 text-xs font-medium backdrop-blur-md ${activeMeta.badgeClass} ${activeMeta.neonClass}`}>
        Editing: {activeMeta.title}
      </div>
    </div>
  );
}
