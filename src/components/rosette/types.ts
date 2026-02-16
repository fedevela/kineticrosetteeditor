export type Size = {
  width: number;
  height: number;
};

export type Point = {
  x: number;
  y: number;
};

export type EditorLevel = "shape" | "rosette" | "tiling";

export type TilingLattice = "hex" | "square";

export type LevelMeta = {
  title: string;
  shortTitle: string;
  description: string;
  buttonClass: string;
  badgeClass: string;
  accentTextClass: string;
};

export type TilingCell = {
  x: number;
  y: number;
  ring: number;
};
