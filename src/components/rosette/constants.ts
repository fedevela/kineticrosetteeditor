import {
  EditorLevel,
  LevelMeta,
  Point,
  TessellationBranchOrder,
  TessellationSymmetry,
} from "./types";

const ORDER_BASES = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const ALLOWED_ORDERS = Array.from(
  new Set(
    ORDER_BASES.flatMap((base) =>
      Array.from({ length: Math.floor(128 / base) }, (_, index) => base * (index + 1)),
    ),
  ),
).sort((a, b) => a - b);
export const MIN_ORDER = ALLOWED_ORDERS[0];
export const MAX_ORDER = ALLOWED_ORDERS[ALLOWED_ORDERS.length - 1];
export const DEFAULT_ORDER = 8;

export const BASE_ORIENTATION_DEG = 95;
export const MIN_BASE_ORIENTATION_DEG = -180;
export const MAX_BASE_ORIENTATION_DEG = 180;
export const MIN_LINE_THICKNESS = 0.5;
export const MAX_LINE_THICKNESS = 12;
export const DEFAULT_LINE_THICKNESS = 1.8;
export const MIN_TILING_SPACING = 80;
export const MAX_TILING_SPACING = 460;
export const DEFAULT_TILING_SPACING = 220;
export const MIN_TILING_RINGS = 1;
export const MAX_TILING_RINGS = 4;
export const DEFAULT_TILING_RINGS = 1;
export const DEFAULT_TESSELLATION_SYMMETRY: TessellationSymmetry = "translation";
export const DEFAULT_TESSELLATION_BRANCH_ORDER: TessellationBranchOrder = "ring";
export const MIN_FOLD_PROGRESS = 0;
export const MAX_FOLD_PROGRESS = 1;
export const DEFAULT_FOLD_PROGRESS = 0;

export const DEFAULT_BASE_LINE: Point[] = [
  { x: -10, y: 12 },
  { x: 42, y: -10 },
  { x: 58, y: -64 },
  { x: -6, y: -112 },
];

export const LEVEL_META: Record<EditorLevel, LevelMeta> = {
  sprite: {
    title: "Sprite Domain",
    shortTitle: "Sprite",
    description: "Edit active sprite geometry and Bezier context.",
    buttonClass: "border-amber-300/70 bg-amber-500/15 text-amber-200",
    badgeClass: "border-amber-300/70 bg-amber-500/15 text-amber-200",
    accentTextClass: "text-amber-300",
    neonClass: "shadow-[0_0_0_1px_rgba(255,207,77,0.2),0_0_22px_rgba(255,207,77,0.14)]",
  },
  slice: {
    title: "Slice Domain",
    shortTitle: "Slice",
    description: "Compose the slice with n sprites and per-sprite transforms.",
    buttonClass: "border-amber-300/70 bg-amber-500/15 text-amber-200",
    badgeClass: "border-amber-300/70 bg-amber-500/15 text-amber-200",
    accentTextClass: "text-amber-300",
    neonClass: "shadow-[0_0_0_1px_rgba(255,207,77,0.2),0_0_22px_rgba(255,207,77,0.14)]",
  },
  rosette: {
    title: "Rosette Domain",
    shortTitle: "Rosette",
    description: "Edit replication rules (order, mirror and motif style).",
    buttonClass: "border-cyan-300/70 bg-cyan-500/15 text-cyan-200",
    badgeClass: "border-cyan-300/70 bg-cyan-500/15 text-cyan-200",
    accentTextClass: "text-cyan-300",
    neonClass: "shadow-[0_0_0_1px_rgba(0,240,255,0.22),0_0_22px_rgba(0,240,255,0.18)]",
  },
  tiling: {
    title: "Tiling Domain",
    shortTitle: "Tiling",
    description: "Compose repeated rosette cells into larger tiled patterns.",
    buttonClass: "border-violet-300/70 bg-violet-500/15 text-violet-200",
    badgeClass: "border-violet-300/70 bg-violet-500/15 text-violet-200",
    accentTextClass: "text-violet-300",
    neonClass: "shadow-[0_0_0_1px_rgba(204,255,0,0.2),0_0_22px_rgba(204,255,0,0.16)]",
  },
};
