export type Size = {
  width: number;
  height: number;
};

export type Point = {
  x: number;
  y: number;
};

export type SpriteType = "polyline";

export type SpriteStyle = {
  strokeWidth?: number;
  dash?: number[];
  opacity?: number;
};

export type SpriteConstraints = {
  endpointOnSymmetryAxis?: boolean;
  mirrorPairs?: Array<[number, number]>;
  snapToAxisThresholdPx?: number;
};

export type Sprite = {
  id: string;
  type: SpriteType;
  points: Point[];
  isClosed?: boolean;
  enabled?: boolean;
  style?: SpriteStyle;
  constraints?: SpriteConstraints;
};

export type SliceState = {
  activeSpriteId: string;
  sprites: Sprite[];
};

export type RosetteProjectState = {
  editorLevel: EditorLevel;
  order: number;
  lineThickness: number;
  baseOrientationDeg: number;
  mirrorAdjacency: boolean;
  sliceState: SliceState;
  tilingLattice: TilingLattice;
  tilingSpacing: number;
  tilingRings: number;
  interCellRotation: number;
  tessellationSymmetry: TessellationSymmetry;
  tessellationBranchOrder: TessellationBranchOrder;
  foldProgress: number;
  fixedCellId: string;
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
