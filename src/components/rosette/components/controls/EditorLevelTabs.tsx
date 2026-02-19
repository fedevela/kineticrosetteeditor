import { LEVEL_META } from "../../constants";
import { EditorLevel } from "../../types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ControlCard } from "./ControlPrimitives";

type EditorLevelTabsProps = {
  editorLevel: EditorLevel;
  setEditorLevel: (level: EditorLevel) => void;
};

export function EditorLevelTabs({ editorLevel, setEditorLevel }: EditorLevelTabsProps) {
  return (
    <ControlCard>
      <Tabs value={editorLevel} onValueChange={(value) => setEditorLevel(value as EditorLevel)}>
        <TabsList className="grid h-auto w-full grid-cols-4 gap-1 bg-transparent p-0">
          {(Object.keys(LEVEL_META) as EditorLevel[]).map((level) => {
            const levelMeta = LEVEL_META[level];
            const isActive = editorLevel === level;

            return (
              <TabsTrigger
                key={level}
                value={level}
                className={cn(
                  "h-auto rounded-md border px-2 py-1.5 text-xs transition",
                  isActive
                    ? `${levelMeta.buttonClass} ${levelMeta.neonClass}`
                    : "border-white/10 bg-slate-800/70 text-slate-100 hover:border-white/20 hover:bg-slate-700/70 data-[state=active]:border-white/10 data-[state=active]:bg-slate-800/70 data-[state=active]:text-slate-100",
                )}
              >
                {levelMeta.shortTitle}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </ControlCard>
  );
}
