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
  { x: 0, y: 0 },
  { x: 34, y: -18 },
  { x: 58, y: -52 },
  { x: 36, y: -92 },
  { x: 0, y: -130 },
];

export const LEVEL_META: Record<EditorLevel, LevelMeta> = {
  shape: {
    title: "Level 1 — Shape",
    shortTitle: "L1 Shape",
    description: "Edit the seed geometry only (handles and base curve).",
    buttonClass: "border-amber-400/70 bg-amber-500/15 text-amber-200",
    badgeClass: "border-amber-400/70 bg-amber-500/15 text-amber-200",
    accentTextClass: "text-amber-300",
  },
  rosette: {
    title: "Level 2 — Rosette",
    shortTitle: "L2 Rosette",
    description: "Edit replication rules (order, mirror and motif style).",
    buttonClass: "border-cyan-400/70 bg-cyan-500/15 text-cyan-200",
    badgeClass: "border-cyan-400/70 bg-cyan-500/15 text-cyan-200",
    accentTextClass: "text-cyan-300",
  },
  tiling: {
    title: "Level 3 — Tiling",
    shortTitle: "L3 Tiling",
    description: "Compose repeated rosette cells into larger tiled patterns.",
    buttonClass: "border-violet-400/70 bg-violet-500/15 text-violet-200",
    badgeClass: "border-violet-400/70 bg-violet-500/15 text-violet-200",
    accentTextClass: "text-violet-300",
  },
};
