import { LevelMeta } from "../types";

type EditingBadgeProps = {
  activeMeta: LevelMeta;
};

export function EditingBadge({ activeMeta }: EditingBadgeProps) {
  return (
    <div className="pointer-events-none absolute right-4 top-4 z-10">
      <div className={`rounded-md border px-3 py-1.5 text-xs font-medium shadow ${activeMeta.badgeClass}`}>
        Editing: {activeMeta.title}
      </div>
    </div>
  );
}
