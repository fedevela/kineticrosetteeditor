import { LEVEL_META } from "../constants";
import { useEditorState } from "../state/editorStore";

export function EditingBadge() {
  const { editorLevel } = useEditorState();
  const activeMeta = LEVEL_META[editorLevel];
  const neonClass =
    editorLevel === "shape" ? "kr-neon-amber" : editorLevel === "rosette" ? "kr-neon-cyan" : "kr-neon-lime";
  return (
    <div className="editing-badge-wrap">
      <div className={`kr-glass-inset editing-badge ${activeMeta.badgeClass} ${neonClass}`}>
        Editing: {activeMeta.title}
      </div>
    </div>
  );
}
