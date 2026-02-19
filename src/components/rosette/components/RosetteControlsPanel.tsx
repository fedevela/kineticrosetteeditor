import {
  LEVEL_META,
} from "../constants";
import { useEditorActions, useEditorHistory, useEditorState } from "../state/editorStore";
import { getActiveSprite } from "../domains/sprite";
import { EditorLevelTabs } from "./controls/EditorLevelTabs";
import { SpriteControls } from "./controls/SpriteControls";
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
  const activeSprite = getActiveSprite(sliceState);
  const activeSpritePointsLength = activeSprite?.points.length ?? 0;

  const isSpriteLevel = editorLevel === "sprite";
  const isSliceLevel = editorLevel === "slice";
  const isRosetteLevel = editorLevel === "rosette";
  const isTilingLevel = editorLevel === "tiling";
  const activeMeta = LEVEL_META[editorLevel];
  return (
    <div className="kr-glass-panel rosette-controls-panel">
      <div>
        <p className="panel-eyebrow">Kinetic Rosette — Multi-Domain Editor</p>
        <p className="panel-subtext">
          Separate edits by domain: sprites, slice composition, rosette rules, and tiling.
        </p>
      </div>

      <div className="controls-stack">
        <EditorLevelTabs editorLevel={editorLevel} setEditorLevel={actions.setEditorLevel} />

        <div className="kr-glass-inset panel-card">
          <p className={activeMeta.accentTextClass}>{activeMeta.title}</p>
          <p className="small-text">{activeMeta.description}</p>
        </div>

        {isSpriteLevel && (
          <SpriteControls
            sprite={activeSprite}
            activeSpritePointsLength={activeSpritePointsLength}
            updateSpriteTransform={actions.updateSpriteTransform}
            updateSpriteBezier={actions.updateSpriteBezier}
            addHandle={actions.addHandle}
            removeHandle={actions.removeHandle}
          />
        )}

        {isSliceLevel && (
          <ShapeControls
            sliceState={sliceState}
            activeSpritePointsLength={activeSpritePointsLength}
            setActiveSprite={actions.setActiveSprite}
            setSpriteEnabled={actions.setSpriteEnabled}
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

        <div className="row-between section-divider">
          <p className="small-text">
            {isSpriteLevel && "Edit active sprite handles and Bezier context."}
            {isSliceLevel && "Manage sprites in the slice and choose which sprite is active."}
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
