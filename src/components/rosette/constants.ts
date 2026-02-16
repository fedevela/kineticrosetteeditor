import { EditorLevel, LevelMeta, Point } from "./types";

export const ALLOWED_ORDERS = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const MIN_ORDER = ALLOWED_ORDERS[0];
export const MAX_ORDER = ALLOWED_ORDERS[ALLOWED_ORDERS.length - 1];
export const DEFAULT_ORDER = 8;

export const BASE_ORIENTATION_DEG = 95;
export const MIN_LINE_THICKNESS = 0.5;
export const MAX_LINE_THICKNESS = 12;
export const DEFAULT_LINE_THICKNESS = 1.8;
export const MIN_TILING_SPACING = 80;
export const MAX_TILING_SPACING = 460;
export const DEFAULT_TILING_SPACING = 220;
export const MIN_TILING_RINGS = 1;
export const MAX_TILING_RINGS = 4;
export const DEFAULT_TILING_RINGS = 1;

export const DEFAULT_BASE_LINE: Point[] = [
  { x: -80, y: 0 },
  { x: 0, y: -24 },
  { x: 80, y: 0 },
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
