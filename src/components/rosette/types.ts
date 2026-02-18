export type Size = {
  width: number;
  height: number;
};

export type Point = {
  x: number;
  y: number;
};

export type ShapeType = "polyline";

export type ShapeStyle = {
  strokeWidth?: number;
  dash?: number[];
  opacity?: number;
};

export type ShapeConstraints = {
  endpointOnSymmetryAxis?: boolean;
  mirrorPairs?: Array<[number, number]>;
  snapToAxisThresholdPx?: number;
};

export type BaseShape = {
  id: string;
  type: ShapeType;
  points: Point[];
  isClosed?: boolean;
  enabled?: boolean;
  style?: ShapeStyle;
  constraints?: ShapeConstraints;
};

export type BaseState = {
  activeShapeId: string;
  shapes: BaseShape[];
};

export type Viewport = {
  scale: number;
  offset: Point;
};

export type EditorLevel = "shape" | "rosette" | "tiling";

export type TilingLattice = "hex" | "square";

export type TessellationSymmetry = "translation" | "reflection" | "glide";

export type TessellationBranchOrder = "ring" | "spiral" | "axis-first";

export type LevelMeta = {
  title: string;
  shortTitle: string;
  description: string;
  buttonClass: string;
  badgeClass: string;
  accentTextClass: string;
};

export type TilingCell = {
  id: string;
  x: number;
  y: number;
  ring: number;
  q: number;
  r: number;
};

export type TessellationEdge = {
  parentId: string;
  childId: string;
  parentPetal: number;
  childPetal: number;
  depth: number;
};

export type TessellationNodePose = {
  id: string;
  x: number;
  y: number;
  ring: number;
  depth: number;
  orientation: number;
  foldedAxis: number;
  mirrored: boolean;
  glideOffset: number;
  isRoot: boolean;
  isFixed: boolean;
};

export type TessellationMechanism = {
  cells: TilingCell[];
  edges: TessellationEdge[];
  poses: TessellationNodePose[];
};
