import { LEVEL_META } from "../constants";
import { useEditorState } from "../state/editorStore";

export function EditingBadge() {
  const { editorLevel } = useEditorState();
  const activeMeta = LEVEL_META[editorLevel];
  return (
    <div className="editing-badge-wrap">
      <div className={`kr-glass-inset editing-badge ${activeMeta.badgeClass} ${activeMeta.neonClass}`}>
        Editing: {activeMeta.title}
      </div>
    </div>
  );
}
