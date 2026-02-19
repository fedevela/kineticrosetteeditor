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

type OptionGroupProps<T extends string> = {
  options: ReadonlyArray<readonly [T, string]>;
  selected: T;
  onSelect: (value: T) => void;
  gridClassName: string;
};

function OptionGroup<T extends string>({ options, selected, onSelect, gridClassName }: OptionGroupProps<T>) {
  return (
    <div className={gridClassName}>
      {options.map(([value, label]) => {
        const active = selected === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={`rounded-md border px-2 py-1 text-[11px] transition ${active ? "border-violet-300/80 bg-violet-500/25 text-violet-100 shadow-[0_0_16px_rgba(204,255,0,0.15)]" : "border-white/10 bg-slate-800/70 text-violet-200 hover:border-white/20 hover:bg-slate-700/70"}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

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
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-slate-900/65 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_8px_28px_rgba(2,6,23,0.35)] backdrop-blur-md">
      <p className="text-[11px] text-violet-200">Tiling controls</p>
      <OptionGroup
        options={[
          ["hex", "Hex lattice"],
          ["square", "Square grid"],
        ]}
        selected={tilingLattice}
        onSelect={setTilingLattice}
        gridClassName="grid grid-cols-2 gap-1"
      />
      <div>
        <p className="mb-1 text-xs text-slate-300/80">Symmetry operation</p>
        <OptionGroup
          options={[
            ["translation", "Translation"],
            ["reflection", "Reflection"],
            ["glide", "Glide"],
          ]}
          selected={tessellationSymmetry}
          onSelect={setTessellationSymmetry}
          gridClassName="grid grid-cols-3 gap-1"
        />
      </div>
      <div>
        <p className="mb-1 text-xs text-slate-300/80">Branch order</p>
        <OptionGroup
          options={[
            ["ring", "Ring"],
            ["spiral", "Spiral"],
            ["axis-first", "Axis first"],
          ]}
          selected={tessellationBranchOrder}
          onSelect={setTessellationBranchOrder}
          gridClassName="grid grid-cols-3 gap-1"
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label htmlFor="tiling-rings" className="text-xs text-slate-300/80">Expansion rings</label>
          <span className="text-xs tabular-nums text-slate-100">{tilingRings}</span>
        </div>
        <input id="tiling-rings" type="range" min={MIN_TILING_RINGS} max={MAX_TILING_RINGS} step={1} value={tilingRings} onChange={(event) => setTilingRings(Number(event.target.value))} className="w-full accent-violet-400" aria-label="Expansion rings" />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label htmlFor="tiling-spacing" className="text-xs text-slate-300/80">Cell spacing</label>
          <span className="text-xs tabular-nums text-slate-100">{tilingSpacing}</span>
        </div>
        <input id="tiling-spacing" type="range" min={MIN_TILING_SPACING} max={MAX_TILING_SPACING} step={2} value={tilingSpacing} onChange={(event) => setTilingSpacing(Number(event.target.value))} className="w-full accent-violet-400" aria-label="Cell spacing" />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label htmlFor="inter-cell-rotation" className="text-xs text-slate-300/80">Inter-cell rotation</label>
          <span className="text-xs tabular-nums text-slate-100">{interCellRotation}°</span>
        </div>
        <input id="inter-cell-rotation" type="range" min={-30} max={30} step={1} value={interCellRotation} onChange={(event) => setInterCellRotation(Number(event.target.value))} className="w-full accent-violet-400" aria-label="Inter-cell rotation" />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label htmlFor="base-orientation" className="text-xs text-slate-300/80">Base rotation</label>
          <span className="text-xs tabular-nums text-slate-100">{baseOrientationDeg}°</span>
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
        <div className="mb-1 flex items-center justify-between gap-2">
          <label htmlFor="fold-progress" className="text-xs text-slate-300/80">Fold progression</label>
          <span className="text-xs tabular-nums text-slate-100">{Math.round(foldProgress * 100)}%</span>
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
        <div className="mb-1 flex items-center justify-between gap-2">
          <label htmlFor="fixed-cell-id" className="text-xs text-slate-300/80">Fixed cell id</label>
          <span className="text-[11px] text-slate-300/80">e.g. 0,0</span>
        </div>
        <input
          id="fixed-cell-id"
          type="text"
          value={fixedCellId}
          onChange={(event) => setFixedCellId(event.target.value)}
          className="w-full rounded-md border border-white/10 bg-slate-800/70 px-2 py-1.5 text-xs text-violet-100 outline-none transition focus:border-white/30"
        />
      </div>
    </div>
  );
}
