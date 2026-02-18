import {
  LEVEL_META,
} from "../constants";
import { useEditorActions, useEditorHistory, useEditorState } from "../state/editorStore";
import { getActiveSprite } from "../domains/sprite";
import { EditorLevelTabs } from "./controls/EditorLevelTabs";
import { ShapeControls } from "./controls/ShapeControls";
import { RosetteControls } from "./controls/RosetteControls";
import { TilingControls } from "./controls/TilingControls";
import { HistoryControls } from "./controls/HistoryControls";
export function RosetteControlsPanel() {
  const state = useEditorState();
  const actions = useEditorActions();
  const { canUndo, canRedo } = useEditorHistory();

  const {
    editorLevel,
    order,
    lineThickness,
    baseOrientationDeg,
    mirrorAdjacency,
    sliceState,
    tilingLattice,
    tessellationSymmetry,
    tessellationBranchOrder,
    tilingRings,
    tilingSpacing,
    interCellRotation,
    foldProgress,
    fixedCellId,
  } = state;
  const activeSpritePointsLength = getActiveSprite(sliceState)?.points.length ?? 0;

  const isShapeLevel = editorLevel === "shape";
  const isRosetteLevel = editorLevel === "rosette";
  const isTilingLevel = editorLevel === "tiling";
  const activeMeta = LEVEL_META[editorLevel];
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-10 w-[27rem] rounded-md border border-zinc-600/80 bg-zinc-900/85 p-3 text-zinc-100 shadow-lg backdrop-blur-sm">
      <div className="mb-2">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Kinetic Rosette — Multi-Domain Editor</p>
        <p className="mt-1 text-xs text-zinc-400">
          Separate edits by domain: sprites, slice composition, rosette rules, and tiling.
        </p>
      </div>

      <div className="pointer-events-auto mt-3 space-y-3">
        <EditorLevelTabs editorLevel={editorLevel} setEditorLevel={actions.setEditorLevel} />

        <div className="rounded-md border border-zinc-700/90 bg-zinc-950/45 p-2">
          <p className={`text-xs font-semibold ${activeMeta.accentTextClass}`}>{activeMeta.title}</p>
          <p className="mt-1 text-[11px] text-zinc-400">{activeMeta.description}</p>
        </div>

        {isShapeLevel && (
          <ShapeControls
            sliceState={sliceState}
            activeSpritePointsLength={activeSpritePointsLength}
            setActiveSprite={actions.setActiveSprite}
            setSpriteEnabled={actions.setSpriteEnabled}
            setSpriteAxisConstraint={actions.setSpriteAxisConstraint}
            addSprite={actions.addSprite}
            removeSprite={actions.removeSprite}
            addHandle={actions.addHandle}
            removeHandle={actions.removeHandle}
          />
        )}

        {isRosetteLevel && (
          <RosetteControls
            order={order}
            setOrder={actions.setOrder}
            mirrorAdjacency={mirrorAdjacency}
            setMirrorAdjacency={actions.setMirrorAdjacency}
            lineThickness={lineThickness}
            setLineThickness={actions.setLineThickness}
          />
        )}

        {isTilingLevel && (
          <TilingControls
            tilingLattice={tilingLattice}
            setTilingLattice={actions.setTilingLattice}
            tessellationSymmetry={tessellationSymmetry}
            setTessellationSymmetry={actions.setTessellationSymmetry}
            tessellationBranchOrder={tessellationBranchOrder}
            setTessellationBranchOrder={actions.setTessellationBranchOrder}
            tilingRings={tilingRings}
            setTilingRings={actions.setTilingRings}
            tilingSpacing={tilingSpacing}
            setTilingSpacing={actions.setTilingSpacing}
            interCellRotation={interCellRotation}
            setInterCellRotation={actions.setInterCellRotation}
            baseOrientationDeg={baseOrientationDeg}
            setBaseOrientationDeg={actions.setBaseOrientationDeg}
            foldProgress={foldProgress}
            setFoldProgress={actions.setFoldProgress}
            fixedCellId={fixedCellId}
            setFixedCellId={actions.setFixedCellId}
          />
        )}

        <div className="flex items-center justify-between border-t border-zinc-700/70 pt-2">
          <p className="text-[11px] text-zinc-400">
            {isShapeLevel && "Drag amber handles to author the active sprite in the slice."}
            {isRosetteLevel &&
              (mirrorAdjacency
                ? "Mirrored neighbors ON: odd sectors are reflected."
                : "Mirrored neighbors OFF: all sectors share orientation.")}
            {isTilingLevel && `Tiling ${tilingLattice} layout · rings ${tilingRings} · spacing ${tilingSpacing} · ${tessellationSymmetry} symmetry.`}
          </p>
          <HistoryControls
            canUndo={canUndo}
            canRedo={canRedo}
            undo={actions.undo}
            redo={actions.redo}
            onResetProject={() => {
              if (!window.confirm("Reset project to defaults? This will discard current edits.")) return;
              actions.reset();
            }}
          />
        </div>
      </div>
    </div>
  );
}
