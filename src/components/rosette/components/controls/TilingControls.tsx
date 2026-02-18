import {
  MAX_BASE_ORIENTATION_DEG,
  MAX_FOLD_PROGRESS,
  MAX_TILING_RINGS,
  MAX_TILING_SPACING,
  MIN_BASE_ORIENTATION_DEG,
  MIN_FOLD_PROGRESS,
  MIN_TILING_RINGS,
  MIN_TILING_SPACING,
} from "../../constants";
import { TessellationBranchOrder, TessellationSymmetry, TilingLattice } from "../../types";

type TilingControlsProps = {
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
  baseOrientationDeg: number;
  setBaseOrientationDeg: (value: number) => void;
  foldProgress: number;
  setFoldProgress: (value: number) => void;
  fixedCellId: string;
  setFixedCellId: (value: string) => void;
};

export function TilingControls({
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
  baseOrientationDeg,
  setBaseOrientationDeg,
  foldProgress,
  setFoldProgress,
  fixedCellId,
  setFixedCellId,
}: TilingControlsProps) {
  return (
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
    </div>
  );
}
