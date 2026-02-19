import {
  TessellationBranchOrder,
  TessellationEdge,
  TessellationMechanism,
  TessellationNodePose,
  TessellationSymmetry,
  TilingCell,
  TilingLattice,
} from "../types";
import { invariant } from "../invariant";

const angleBetween = (from: TilingCell, to: TilingCell) => Math.atan2(to.y - from.y, to.x - from.x);

const euclideanDistance = (a: TilingCell, b: TilingCell) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const estimateSpacing = (cells: TilingCell[]) => {
  if (cells.length < 2) return 0;

  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < cells.length; i += 1) {
    for (let j = i + 1; j < cells.length; j += 1) {
      const distance = euclideanDistance(cells[i], cells[j]);
      if (distance > 1e-6 && distance < min) min = distance;
    }
  }

  return Number.isFinite(min) ? min : 0;
};

const normalizeAngle = (angle: number) => {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= Math.PI * 2;
  while (normalized <= -Math.PI) normalized += Math.PI * 2;
  return normalized;
};

const foldTowardSymmetry = (
  parentOrientation: number,
  depth: number,
  symmetry: TessellationSymmetry,
  interCellRotation: number,
) => {
  if (symmetry === "translation") {
    return normalizeAngle(parentOrientation + interCellRotation);
  }

  if (symmetry === "reflection") {
    const reflected = depth % 2 === 0 ? parentOrientation : Math.PI - parentOrientation;
    return normalizeAngle(reflected + interCellRotation * (depth % 2 === 0 ? 1 : -1));
  }

  const glided = depth % 2 === 0 ? parentOrientation : -parentOrientation;
  return normalizeAngle(glided + interCellRotation * (depth % 2 === 0 ? 1 : -1));
};

const sortCellsByBranchOrder = (cells: TilingCell[], order: TessellationBranchOrder) => {
  const byAngle = (a: TilingCell, b: TilingCell) => {
    const angleA = Math.atan2(a.y, a.x);
    const angleB = Math.atan2(b.y, b.x);
    return angleA - angleB;
  };

  return [...cells].sort((a, b) => {
    if (a.id === "0,0") return -1;
    if (b.id === "0,0") return 1;

    if (order === "ring") {
      if (a.ring !== b.ring) return a.ring - b.ring;
      return byAngle(a, b);
    }

    if (order === "spiral") {
      const angleDiff = byAngle(a, b);
      if (Math.abs(angleDiff) > 1e-6) return angleDiff;
      return a.ring - b.ring;
    }

    const axisPriorityA = Math.abs(a.r);
    const axisPriorityB = Math.abs(b.r);
    if (axisPriorityA !== axisPriorityB) return axisPriorityA - axisPriorityB;
    if (a.ring !== b.ring) return a.ring - b.ring;
    return byAngle(a, b);
  });
};

const chooseParent = (target: TilingCell, visited: TilingCell[]) => {
  const sorted = [...visited].sort((a, b) => {
    const distDiff = euclideanDistance(a, target) - euclideanDistance(b, target);
    if (Math.abs(distDiff) > 1e-6) return distDiff;
    return a.ring - b.ring;
  });

  return sorted[0] ?? target;
};

const computePetalIndex = (angle: number, order: number) => {
  const fullTurn = Math.PI * 2;
  const wrapped = ((angle % fullTurn) + fullTurn) % fullTurn;
  return Math.round((wrapped / fullTurn) * order) % order;
};

export const buildTilingCells = (
  tilingLattice: TilingLattice,
  tilingRings: number,
  tilingSpacing: number,
): TilingCell[] => {
  const spacing = tilingSpacing;

  if (tilingLattice === "square") {
    return Array.from({ length: tilingRings * 2 + 1 }, (_, rowOffset) => {
      const row = rowOffset - tilingRings;

      return Array.from({ length: tilingRings * 2 + 1 }, (_, colOffset) => {
        const col = colOffset - tilingRings;
        const ring = Math.max(Math.abs(row), Math.abs(col));

        return {
          id: `${col},${row}`,
          x: col * spacing,
          y: row * spacing,
          ring,
          q: col,
          r: row,
        };
      });
    }).flat();
  }

  const sin60 = Math.sqrt(3) / 2;
  const cells: TilingCell[] = [];

  for (let r = -tilingRings; r <= tilingRings; r += 1) {
    for (let q = -tilingRings; q <= tilingRings; q += 1) {
      const s = -q - r;
      const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      if (ring > tilingRings) continue;

      cells.push({
        id: `${q},${r}`,
        x: spacing * (q + r / 2),
        y: spacing * sin60 * r,
        ring,
        q,
        r,
      });
    }
  }

  return cells;
};

type BuildTessellationMechanismInput = {
  cells: TilingCell[];
  order: number;
  baseOrientation: number;
  interCellRotation: number;
  symmetry: TessellationSymmetry;
  branchOrder: TessellationBranchOrder;
  fixedCellId?: string;
};

export const buildTessellationMechanism = ({
  cells,
  order,
  baseOrientation,
  interCellRotation,
  symmetry,
  branchOrder,
  fixedCellId,
}: BuildTessellationMechanismInput): TessellationMechanism => {
  if (cells.length === 0) {
    return { cells: [], edges: [], poses: [] };
  }

  const root =
    cells.find((cell) => cell.id === fixedCellId) ??
    cells.find((cell) => cell.id === "0,0") ??
    cells[0];

  invariant(root != null, "Tessellation root cell could not be resolved", {
    context: { fixedCellId, cellCount: cells.length },
    recoverable: true,
  });

  const sorted = sortCellsByBranchOrder(cells, branchOrder);
  const spacing = estimateSpacing(cells);
  const visited: TilingCell[] = [root];

  const poses = new Map<string, TessellationNodePose>();
  poses.set(root.id, {
    id: root.id,
    x: root.x,
    y: root.y,
    ring: root.ring,
    depth: 0,
    orientation: normalizeAngle(baseOrientation),
    foldedAxis: normalizeAngle(baseOrientation),
    mirrored: false,
    glideOffset: 0,
    isRoot: true,
    isFixed: root.id === fixedCellId || fixedCellId === undefined,
  });

  const edges: TessellationEdge[] = [];

  for (const cell of sorted) {
    if (cell.id === root.id) continue;
    const parent = chooseParent(cell, visited);
    const parentPose = poses.get(parent.id);
    if (!parentPose) continue;

    const depth = parentPose.depth + 1;
    const linkAngle = angleBetween(parent, cell);
    const parentPetal = computePetalIndex(linkAngle, order);
    const childPetal = (parentPetal + Math.round(order / 2)) % order;
    const orientation = foldTowardSymmetry(
      parentPose.orientation,
      depth,
      symmetry,
      interCellRotation,
    );
    const mirrored =
      symmetry === "translation" ? false : depth % 2 === 1 ? !parentPose.mirrored : parentPose.mirrored;
    const glideOffset =
      symmetry === "glide"
        ? (depth % 2 === 0 ? 1 : -1) * Math.max(spacing * 0.22, 10)
        : 0;

    edges.push({
      parentId: parent.id,
      childId: cell.id,
      parentPetal,
      childPetal,
      depth,
    });

    poses.set(cell.id, {
      id: cell.id,
      x: cell.x,
      y: cell.y,
      ring: cell.ring,
      depth,
      orientation,
      foldedAxis: normalizeAngle(linkAngle),
      mirrored,
      glideOffset,
      isRoot: false,
      isFixed: cell.id === fixedCellId,
    });

    visited.push(cell);
  }

  const sortedPoses = [...poses.values()].sort((a, b) => a.depth - b.depth || a.ring - b.ring);

  return {
    cells,
    edges,
    poses: sortedPoses,
  };
};
