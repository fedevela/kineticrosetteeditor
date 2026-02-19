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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ControlCard, SliderField } from "./ControlPrimitives";

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
          <Button
            key={value}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelect(value)}
            className={`h-auto rounded-md border px-2 py-1 text-[11px] transition ${active ? "border-violet-300/80 bg-violet-500/25 text-violet-100 shadow-[0_0_16px_rgba(204,255,0,0.15)]" : "border-white/10 bg-slate-800/70 text-violet-200 hover:border-white/20 hover:bg-slate-700/70"}`}
          >
            {label}
          </Button>
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
    <ControlCard>
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
      <SliderField id="tiling-rings" label="Expansion rings" valueLabel={`${tilingRings}`} value={tilingRings} min={MIN_TILING_RINGS} max={MAX_TILING_RINGS} step={1} onChange={setTilingRings} />
      <SliderField id="tiling-spacing" label="Cell spacing" valueLabel={`${tilingSpacing}`} value={tilingSpacing} min={MIN_TILING_SPACING} max={MAX_TILING_SPACING} step={2} onChange={setTilingSpacing} />
      <SliderField id="inter-cell-rotation" label="Inter-cell rotation" valueLabel={`${interCellRotation}°`} value={interCellRotation} min={-30} max={30} step={1} onChange={setInterCellRotation} />
      <SliderField id="base-orientation" label="Base rotation" valueLabel={`${baseOrientationDeg}°`} value={baseOrientationDeg} min={MIN_BASE_ORIENTATION_DEG} max={MAX_BASE_ORIENTATION_DEG} step={1} onChange={setBaseOrientationDeg} />
      <SliderField id="fold-progress" label="Fold progression" valueLabel={`${Math.round(foldProgress * 100)}%`} value={foldProgress} min={MIN_FOLD_PROGRESS} max={MAX_FOLD_PROGRESS} step={0.01} onChange={setFoldProgress} />
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label htmlFor="fixed-cell-id" className="text-xs text-slate-300/80">Fixed cell id</label>
          <span className="text-[11px] text-slate-300/80">e.g. 0,0</span>
        </div>
        <Input
          id="fixed-cell-id"
          value={fixedCellId}
          onChange={(event) => setFixedCellId(event.target.value)}
          className="h-8 border-white/10 bg-slate-800/70 text-xs text-violet-100"
        />
      </div>
    </ControlCard>
  );
}
