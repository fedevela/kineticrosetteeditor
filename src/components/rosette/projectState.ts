import {
  BASE_ORIENTATION_DEG,
  DEFAULT_FOLD_PROGRESS,
  DEFAULT_LINE_THICKNESS,
  DEFAULT_ORDER,
  DEFAULT_TESSELLATION_BRANCH_ORDER,
  DEFAULT_TESSELLATION_SYMMETRY,
  DEFAULT_TILING_RINGS,
  DEFAULT_TILING_SPACING,
} from "./constants";
import { resetSliceState } from "./domains/sprite";
import { RosetteProjectState } from "./types";

export const createDefaultProjectState = (): RosetteProjectState => ({
  editorLevel: "sprite",
  order: DEFAULT_ORDER,
  lineThickness: DEFAULT_LINE_THICKNESS,
  baseOrientationDeg: BASE_ORIENTATION_DEG,
  mirrorAdjacency: true,
  sliceState: resetSliceState(),
  tilingLattice: "hex",
  tilingSpacing: DEFAULT_TILING_SPACING,
  tilingRings: DEFAULT_TILING_RINGS,
  interCellRotation: 0,
  tessellationSymmetry: DEFAULT_TESSELLATION_SYMMETRY,
  tessellationBranchOrder: DEFAULT_TESSELLATION_BRANCH_ORDER,
  foldProgress: DEFAULT_FOLD_PROGRESS,
  fixedCellId: "0,0",
});
