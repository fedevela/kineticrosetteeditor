import { DEFAULT_BASE_LINE } from "../constants";
import { rotatePoint } from "../math";
import { BaseShape, BaseState, Point } from "../types";

const DEFAULT_AXIS_SNAP_THRESHOLD = 10;
const APPEND_STEP = 28;

const clonePoints = (points: Point[]) => points.map((point) => ({ ...point }));

const createShapeId = () => `shape-${Math.random().toString(36).slice(2, 10)}`;

export const createDefaultShape = (id = createShapeId()): BaseShape => ({
  id,
  type: "polyline",
  points: clonePoints(DEFAULT_BASE_LINE),
  enabled: true,
  constraints: {
    endpointOnSymmetryAxis: true,
    snapToAxisThresholdPx: DEFAULT_AXIS_SNAP_THRESHOLD,
  },
});

export const resetBaseState = (): BaseState => {
  const shape = normalizeShape(createDefaultShape("shape-1"));
  return {
    activeShapeId: shape.id,
    shapes: [shape],
  };
};

export const getActiveShape = (baseState: BaseState) =>
  baseState.shapes.find((shape) => shape.id === baseState.activeShapeId) ?? baseState.shapes[0] ?? null;

const applyEndpointAxisConstraint = (shape: BaseShape, handleIndex: number, point: Point): Point => {
  if (!shape.constraints?.endpointOnSymmetryAxis) return point;
  if (shape.points.length === 0) return point;
  if (handleIndex === 0 || handleIndex === shape.points.length - 1) {
    return { x: 0, y: point.y };
  }
  return point;
};

const applySnapToAxisConstraint = (shape: BaseShape, point: Point): Point => {
  if (!shape.constraints?.endpointOnSymmetryAxis) return point;
  const threshold = shape.constraints?.snapToAxisThresholdPx;
  if (threshold == null) return point;
  return Math.abs(point.x) <= threshold ? { x: 0, y: point.y } : point;
};

export const applyPointConstraints = (
  shape: BaseShape,
  handleIndex: number,
  proposedLocalPoint: Point,
): Point => {
  const endpointConstrained = applyEndpointAxisConstraint(shape, handleIndex, proposedLocalPoint);
  return applySnapToAxisConstraint(shape, endpointConstrained);
};

export const normalizeShape = (shape: BaseShape): BaseShape => {
  if (!shape.constraints?.endpointOnSymmetryAxis || shape.points.length === 0) return shape;

  const nextPoints = shape.points.map((point, index) => {
    if (index === 0 || index === shape.points.length - 1) return { x: 0, y: point.y };
    return point;
  });

  return { ...shape, points: nextPoints };
};

export const normalizeAll = (baseState: BaseState): BaseState => ({
  ...baseState,
  shapes: baseState.shapes.map(normalizeShape),
});

export const updateHandleLocal = (
  baseState: BaseState,
  shapeId: string,
  handleIndex: number,
  globalPoint: Point,
  center: Point,
  baseRotation: number,
): BaseState => {
  const centeredPoint = {
    x: globalPoint.x - center.x,
    y: globalPoint.y - center.y,
  };

  const localPoint = rotatePoint(centeredPoint, -baseRotation);

  return {
    ...baseState,
    shapes: baseState.shapes.map((shape) => {
      if (shape.id !== shapeId) return shape;
      const constrainedPoint = applyPointConstraints(shape, handleIndex, localPoint);
      const points = shape.points.map((point, index) =>
        index === handleIndex ? constrainedPoint : point,
      );
      return normalizeShape({ ...shape, points });
    }),
  };
};

export const closestPointOnSegment = (point: Point, a: Point, b: Point): Point => {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const ap = { x: point.x - a.x, y: point.y - a.y };
  const denom = ab.x * ab.x + ab.y * ab.y;
  if (denom === 0) return a;

  const t = Math.max(0, Math.min(1, (ap.x * ab.x + ap.y * ab.y) / denom));
  return {
    x: a.x + ab.x * t,
    y: a.y + ab.y * t,
  };
};

export const findClosestSegmentIndex = (
  points: Point[],
  point: Point,
  tolerance = Infinity,
): number => {
  if (points.length < 2) return -1;

  let closestIndex = -1;
  let closestDistance = Infinity;

  for (let index = 0; index < points.length - 1; index += 1) {
    const projected = closestPointOnSegment(point, points[index], points[index + 1]);
    const distance = Math.hypot(projected.x - point.x, projected.y - point.y);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  }

  return closestDistance <= tolerance ? closestIndex : -1;
};

const appendPoint = (shape: BaseShape) => {
  const last = shape.points[shape.points.length - 1];
  const previous = shape.points[shape.points.length - 2] ?? { x: last.x - 30, y: last.y };

  const direction = { x: last.x - previous.x, y: last.y - previous.y };
  const directionLength = Math.hypot(direction.x, direction.y) || 1;

  const nextPoint = {
    x: last.x + (direction.x / directionLength) * APPEND_STEP,
    y: last.y + (direction.y / directionLength) * APPEND_STEP,
  };

  return [...shape.points, nextPoint];
};

export type AddPointStrategy =
  | { type: "append" }
  | { type: "insert-on-segment"; point: Point; tolerance?: number }
  | { type: "midpoint"; index: number };

const insertPoint = (points: Point[], index: number, point: Point) => [
  ...points.slice(0, index + 1),
  point,
  ...points.slice(index + 1),
];

const addPointWithStrategy = (shape: BaseShape, strategy: AddPointStrategy): Point[] => {
  if (shape.points.length === 0) return shape.points;

  if (strategy.type === "append") {
    return appendPoint(shape);
  }

  if (strategy.type === "midpoint") {
    const index = Math.max(0, Math.min(shape.points.length - 2, strategy.index));
    const a = shape.points[index];
    const b = shape.points[index + 1];
    return insertPoint(shape.points, index, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  }

  const segmentIndex = findClosestSegmentIndex(shape.points, strategy.point, strategy.tolerance);
  if (segmentIndex < 0) return shape.points;
  const projected = closestPointOnSegment(
    strategy.point,
    shape.points[segmentIndex],
    shape.points[segmentIndex + 1],
  );
  return insertPoint(shape.points, segmentIndex, projected);
};

export const addPoint = (baseState: BaseState, shapeId: string, strategy: AddPointStrategy): BaseState => ({
  ...baseState,
  shapes: baseState.shapes.map((shape) => {
    if (shape.id !== shapeId) return shape;
    return normalizeShape({
      ...shape,
      points: addPointWithStrategy(shape, strategy),
    });
  }),
});

export const removePoint = (
  baseState: BaseState,
  shapeId: string,
  mode: "last" | { index: number } = "last",
): BaseState => ({
  ...baseState,
  shapes: baseState.shapes.map((shape) => {
    if (shape.id !== shapeId || shape.points.length <= 2) return shape;

    if (mode === "last") {
      return normalizeShape({ ...shape, points: shape.points.slice(0, -1) });
    }

    if (mode.index <= 0 || mode.index >= shape.points.length - 1) return shape;
    return normalizeShape({
      ...shape,
      points: [...shape.points.slice(0, mode.index), ...shape.points.slice(mode.index + 1)],
    });
  }),
});

export const setShapeEnabled = (baseState: BaseState, shapeId: string, enabled: boolean): BaseState => ({
  ...baseState,
  shapes: baseState.shapes.map((shape) => (shape.id === shapeId ? { ...shape, enabled } : shape)),
});

export type AxisConstraintMode = "none" | "endpoints-on-axis";

export const getShapeAxisConstraintMode = (shape: BaseShape): AxisConstraintMode =>
  shape.constraints?.endpointOnSymmetryAxis ? "endpoints-on-axis" : "none";

export const setShapeAxisConstraintMode = (
  baseState: BaseState,
  shapeId: string,
  mode: AxisConstraintMode,
): BaseState => ({
  ...baseState,
  shapes: baseState.shapes.map((shape) => {
    if (shape.id !== shapeId) return shape;

    const nextShape: BaseShape = {
      ...shape,
      constraints: {
        ...shape.constraints,
        endpointOnSymmetryAxis: mode === "endpoints-on-axis",
        snapToAxisThresholdPx:
          mode === "endpoints-on-axis"
            ? (shape.constraints?.snapToAxisThresholdPx ?? DEFAULT_AXIS_SNAP_THRESHOLD)
            : undefined,
      },
    };

    return normalizeShape(nextShape);
  }),
});

export const setActiveShape = (baseState: BaseState, shapeId: string): BaseState => {
  const exists = baseState.shapes.some((shape) => shape.id === shapeId);
  return exists ? { ...baseState, activeShapeId: shapeId } : baseState;
};

export const addShape = (baseState: BaseState): BaseState => {
  const shape = normalizeShape(createDefaultShape());
  return {
    activeShapeId: shape.id,
    shapes: [...baseState.shapes, shape],
  };
};

export const removeShape = (baseState: BaseState, shapeId: string): BaseState => {
  if (baseState.shapes.length <= 1) return baseState;

  const shapes = baseState.shapes.filter((shape) => shape.id !== shapeId);
  if (shapes.length === baseState.shapes.length) return baseState;

  const nextActive =
    baseState.activeShapeId === shapeId ? (shapes[0]?.id ?? baseState.activeShapeId) : baseState.activeShapeId;

  return {
    activeShapeId: nextActive,
    shapes,
  };
};
