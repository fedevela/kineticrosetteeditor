import {
  DEFAULT_FOLD_PROGRESS,
  LEVEL_META,
  MAX_BASE_ORIENTATION_DEG,
  MAX_FOLD_PROGRESS,
  MAX_LINE_THICKNESS,
  MAX_ORDER,
  MAX_TILING_RINGS,
  MAX_TILING_SPACING,
  MIN_BASE_ORIENTATION_DEG,
  MIN_FOLD_PROGRESS,
  MIN_LINE_THICKNESS,
  MIN_ORDER,
  MIN_TILING_RINGS,
  MIN_TILING_SPACING,
} from "../constants";
import { snapOrder } from "../math";
import {
  EditorLevel,
  TessellationBranchOrder,
  TessellationSymmetry,
  TilingLattice,
} from "../types";

type RosetteControlsPanelProps = {
  editorLevel: EditorLevel;
  setEditorLevel: (level: EditorLevel) => void;
  order: number;
  setOrder: (value: number) => void;
  lineThickness: number;
  setLineThickness: (value: number) => void;
  baseOrientationDeg: number;
  setBaseOrientationDeg: (value: number) => void;
  mirrorAdjacency: boolean;
  setMirrorAdjacency: (value: boolean) => void;
  limitMovementToSymmetricalAxis: boolean;
  setLimitMovementToSymmetricalAxis: (value: boolean) => void;
  baseLinePointsLength: number;
  addHandle: () => void;
  removeHandle: () => void;
  resetShape: () => void;
  resetRosette: () => void;
  tilingLattice: TilingLattice;
  setTilingLattice: (value: TilingLattice) => void;
  tessellationSymmetry: TessellationSymmetry;
  setTessellationSymmetry: (value: TessellationSymmetry) => void;
  tessellationBranchOrder: TessellationBranchOrder;
  setTessellationBranchOrder: (value: TessellationBranchOrder) => void;
  tilingRings: number;
  setTilingRings: (value: number) => void;
  tilingSpacing: number;
  setTilingSpacing: (value: number) => void;
  interCellRotation: number;
  setInterCellRotation: (value: number) => void;
  foldProgress: number;
  setFoldProgress: (value: number) => void;
  fixedCellId: string;
  setFixedCellId: (value: string) => void;
  resetTiling: () => void;
  resetAll: () => void;
};

export function RosetteControlsPanel(props: RosetteControlsPanelProps) {
  const {
    editorLevel,
    setEditorLevel,
    order,
    setOrder,
    lineThickness,
    setLineThickness,
    baseOrientationDeg,
    setBaseOrientationDeg,
    mirrorAdjacency,
    setMirrorAdjacency,
    limitMovementToSymmetricalAxis,
    setLimitMovementToSymmetricalAxis,
    baseLinePointsLength,
    addHandle,
    removeHandle,
    resetShape,
    resetRosette,
    tilingLattice,
    setTilingLattice,
    tessellationSymmetry,
    setTessellationSymmetry,
    tessellationBranchOrder,
    setTessellationBranchOrder,
    tilingRings,
    setTilingRings,
    tilingSpacing,
    setTilingSpacing,
    interCellRotation,
    setInterCellRotation,
    foldProgress,
    setFoldProgress,
    fixedCellId,
    setFixedCellId,
    resetTiling,
    resetAll,
  } = props;

  const isShapeLevel = editorLevel === "shape";
  const isRosetteLevel = editorLevel === "rosette";
  const isTilingLevel = editorLevel === "tiling";
  const activeMeta = LEVEL_META[editorLevel];

  return (
    <div className="pointer-events-none absolute left-4 top-4 z-10 w-[27rem] rounded-md border border-zinc-600/80 bg-zinc-900/85 p-3 text-zinc-100 shadow-lg backdrop-blur-sm">
      <div className="mb-2">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Kinetic Rosette — Multi-Level Editor</p>
        <p className="mt-1 text-xs text-zinc-400">
          Separate edits by level: base shape, rosette rules, and tiling composition.
        </p>
      </div>

      <div className="pointer-events-auto mt-3 space-y-3">
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

        <div className="rounded-md border border-zinc-700/90 bg-zinc-950/45 p-2">
          <p className={`text-xs font-semibold ${activeMeta.accentTextClass}`}>{activeMeta.title}</p>
          <p className="mt-1 text-[11px] text-zinc-400">{activeMeta.description}</p>
        </div>

        {isShapeLevel && (
          <>
            <div className="flex items-center justify-between gap-3 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1.5">
              <label htmlFor="limit-sym-axis" className="text-xs text-amber-100">
                limit movement to symmetrical axis
              </label>
              <input
                id="limit-sym-axis"
                type="checkbox"
                checked={limitMovementToSymmetricalAxis}
                onChange={(event) => setLimitMovementToSymmetricalAxis(event.target.checked)}
                className="h-4 w-4 accent-amber-400"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={addHandle} className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800">Add handle</button>
              <button type="button" onClick={removeHandle} disabled={baseLinePointsLength <= 2} className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">Remove handle</button>
              <span className="text-xs text-zinc-400">handles: {baseLinePointsLength}</span>
            </div>
            <div className="flex items-center justify-end">
              <button type="button" onClick={resetShape} className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800">Reset shape</button>
            </div>
          </>
        )}

        {isRosetteLevel && (
          <>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                <label htmlFor="order-input">Order (n)</label>
                <span className="tabular-nums">{order}</span>
              </div>
              <input id="order-input" type="range" min={MIN_ORDER} max={MAX_ORDER} step={1} value={order} onChange={(event) => setOrder(snapOrder(Number(event.target.value)))} className="w-full accent-cyan-400" aria-label="Rosette order" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="mirror-adj" className="text-xs text-zinc-300">Mirror adjacent linkages</label>
              <input id="mirror-adj" type="checkbox" checked={mirrorAdjacency} onChange={(event) => setMirrorAdjacency(event.target.checked)} className="h-4 w-4 accent-cyan-400" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                <label htmlFor="line-thickness">Line thickness</label>
                <span className="tabular-nums">{lineThickness.toFixed(1)}</span>
              </div>
              <input id="line-thickness" type="range" min={MIN_LINE_THICKNESS} max={MAX_LINE_THICKNESS} step={0.1} value={lineThickness} onChange={(event) => setLineThickness(Number(event.target.value))} className="w-full accent-cyan-400" aria-label="Rosette line thickness" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={resetRosette} className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800">Reset rosette</button>
            </div>
          </>
        )}

        {isTilingLevel && (
          <div className="space-y-2 rounded-md border border-violet-500/35 bg-violet-950/20 p-2">
            <p className="text-xs text-violet-200">Tiling controls</p>
            <div className="grid grid-cols-2 gap-1">
              {([
                ["hex", "Hex lattice"],
                ["square", "Square grid"],
              ] as const).map(([value, label]) => {
                const active = tilingLattice === value;
                return (
                  <button key={value} type="button" onClick={() => setTilingLattice(value)} className={`rounded border px-2 py-1 text-[11px] transition-colors ${active ? "border-violet-300/80 bg-violet-500/25 text-violet-100" : "border-violet-800/60 bg-violet-950/30 text-violet-200/80 hover:border-violet-500/70"}`}>
                    {label}
                  </button>
                );
              })}
            </div>
            <div>
              <p className="mb-1 text-xs text-zinc-300">Symmetry operation</p>
              <div className="grid grid-cols-3 gap-1">
                {([
                  ["translation", "Translation"],
                  ["reflection", "Reflection"],
                  ["glide", "Glide"],
                ] as const).map(([value, label]) => {
                  const active = tessellationSymmetry === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTessellationSymmetry(value)}
                      className={`rounded border px-2 py-1 text-[11px] transition-colors ${active ? "border-violet-300/80 bg-violet-500/25 text-violet-100" : "border-violet-800/60 bg-violet-950/30 text-violet-200/80 hover:border-violet-500/70"}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs text-zinc-300">Branch order</p>
              <div className="grid grid-cols-3 gap-1">
                {([
                  ["ring", "Ring"],
                  ["spiral", "Spiral"],
                  ["axis-first", "Axis first"],
                ] as const).map(([value, label]) => {
                  const active = tessellationBranchOrder === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTessellationBranchOrder(value)}
                      className={`rounded border px-2 py-1 text-[11px] transition-colors ${active ? "border-violet-300/80 bg-violet-500/25 text-violet-100" : "border-violet-800/60 bg-violet-950/30 text-violet-200/80 hover:border-violet-500/70"}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                <label htmlFor="tiling-rings">Expansion rings</label>
                <span className="tabular-nums">{tilingRings}</span>
              </div>
              <input id="tiling-rings" type="range" min={MIN_TILING_RINGS} max={MAX_TILING_RINGS} step={1} value={tilingRings} onChange={(event) => setTilingRings(Number(event.target.value))} className="w-full accent-violet-400" aria-label="Expansion rings" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                <label htmlFor="tiling-spacing">Cell spacing</label>
                <span className="tabular-nums">{tilingSpacing}</span>
              </div>
              <input id="tiling-spacing" type="range" min={MIN_TILING_SPACING} max={MAX_TILING_SPACING} step={2} value={tilingSpacing} onChange={(event) => setTilingSpacing(Number(event.target.value))} className="w-full accent-violet-400" aria-label="Cell spacing" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                <label htmlFor="inter-cell-rotation">Inter-cell rotation</label>
                <span className="tabular-nums">{interCellRotation}°</span>
              </div>
              <input id="inter-cell-rotation" type="range" min={-30} max={30} step={1} value={interCellRotation} onChange={(event) => setInterCellRotation(Number(event.target.value))} className="w-full accent-violet-400" aria-label="Inter-cell rotation" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                <label htmlFor="base-orientation">Base rotation</label>
                <span className="tabular-nums">{baseOrientationDeg}°</span>
              </div>
              <input
                id="base-orientation"
                type="range"
                min={MIN_BASE_ORIENTATION_DEG}
                max={MAX_BASE_ORIENTATION_DEG}
                step={1}
                value={baseOrientationDeg}
                onChange={(event) => setBaseOrientationDeg(Number(event.target.value))}
                className="w-full accent-violet-400"
                aria-label="Base rotation"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                <label htmlFor="fold-progress">Fold progression</label>
                <span className="tabular-nums">{Math.round(foldProgress * 100)}%</span>
              </div>
              <input
                id="fold-progress"
                type="range"
                min={MIN_FOLD_PROGRESS}
                max={MAX_FOLD_PROGRESS}
                step={0.01}
                value={foldProgress}
                onChange={(event) => setFoldProgress(Number(event.target.value))}
                className="w-full accent-violet-400"
                aria-label="Fold progression"
              />
              <button
                type="button"
                onClick={() => setFoldProgress(DEFAULT_FOLD_PROGRESS)}
                className="mt-1 rounded border border-zinc-500 px-2 py-1 text-[11px] text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800"
              >
                Reset fold
              </button>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                <label htmlFor="fixed-cell-id">Fixed cell id</label>
                <span className="text-[11px] text-zinc-400">e.g. 0,0</span>
              </div>
              <input
                id="fixed-cell-id"
                type="text"
                value={fixedCellId}
                onChange={(event) => setFixedCellId(event.target.value)}
                className="w-full rounded border border-violet-800/60 bg-violet-950/30 px-2 py-1 text-xs text-violet-100 outline-none focus:border-violet-400"
              />
            </div>
            <div className="flex items-center justify-end">
              <button type="button" onClick={resetTiling} className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800">Reset tiling</button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-zinc-700/70 pt-2">
          <p className="text-[11px] text-zinc-400">
            {isShapeLevel && "Drag amber handles to author the base seed curve."}
            {isRosetteLevel &&
              (mirrorAdjacency
                ? "Mirrored neighbors ON: odd sectors are reflected."
                : "Mirrored neighbors OFF: all sectors share orientation.")}
            {isTilingLevel && `Tiling ${tilingLattice} layout · rings ${tilingRings} · spacing ${tilingSpacing} · ${tessellationSymmetry} symmetry.`}
          </p>
          <button type="button" onClick={resetAll} className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800">Reset all</button>
        </div>
      </div>
    </div>
  );
}
