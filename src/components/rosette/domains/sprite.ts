import { DEFAULT_BASE_LINE } from "../constants";
import { rotatePoint } from "../math";
import { Point, SliceState, Sprite } from "../types";

const DEFAULT_AXIS_SNAP_THRESHOLD = 10;
const APPEND_STEP = 28;

const clonePoints = (points: Point[]) => points.map((point) => ({ ...point }));

const createSpriteId = () => `sprite-${Math.random().toString(36).slice(2, 10)}`;

export const createDefaultSprite = (id = createSpriteId()): Sprite => ({
  id,
  type: "polyline",
  points: clonePoints(DEFAULT_BASE_LINE),
  enabled: true,
  constraints: {
    endpointOnSymmetryAxis: true,
    snapToAxisThresholdPx: DEFAULT_AXIS_SNAP_THRESHOLD,
  },
});

export const resetSliceState = (): SliceState => {
  const sprite = normalizeSprite(createDefaultSprite("sprite-1"));
  return {
    activeSpriteId: sprite.id,
    sprites: [sprite],
  };
};

export const getActiveSprite = (sliceState: SliceState) =>
  sliceState.sprites.find((sprite) => sprite.id === sliceState.activeSpriteId) ??
  sliceState.sprites[0] ??
  null;

const applyEndpointAxisConstraint = (sprite: Sprite, handleIndex: number, point: Point): Point => {
  if (!sprite.constraints?.endpointOnSymmetryAxis) return point;
  if (sprite.points.length === 0) return point;
  if (handleIndex === 0 || handleIndex === sprite.points.length - 1) {
    return { x: 0, y: point.y };
  }
  return point;
};

const applySnapToAxisConstraint = (sprite: Sprite, point: Point): Point => {
  if (!sprite.constraints?.endpointOnSymmetryAxis) return point;
  const threshold = sprite.constraints?.snapToAxisThresholdPx;
  if (threshold == null) return point;
  return Math.abs(point.x) <= threshold ? { x: 0, y: point.y } : point;
};

export const applyPointConstraints = (
  sprite: Sprite,
  handleIndex: number,
  proposedLocalPoint: Point,
): Point => {
  const endpointConstrained = applyEndpointAxisConstraint(sprite, handleIndex, proposedLocalPoint);
  return applySnapToAxisConstraint(sprite, endpointConstrained);
};

export const normalizeSprite = (sprite: Sprite): Sprite => {
  if (!sprite.constraints?.endpointOnSymmetryAxis || sprite.points.length === 0) return sprite;

  const nextPoints = sprite.points.map((point, index) => {
    if (index === 0 || index === sprite.points.length - 1) return { x: 0, y: point.y };
    return point;
  });

  return { ...sprite, points: nextPoints };
};

export const updateHandleLocal = (
  sliceState: SliceState,
  spriteId: string,
  handleIndex: number,
  globalPoint: Point,
  center: Point,
  baseRotation: number,
): SliceState => {
  const centeredPoint = {
    x: globalPoint.x - center.x,
    y: globalPoint.y - center.y,
  };

  const localPoint = rotatePoint(centeredPoint, -baseRotation);

  return {
    ...sliceState,
    sprites: sliceState.sprites.map((sprite) => {
      if (sprite.id !== spriteId) return sprite;
      const constrainedPoint = applyPointConstraints(sprite, handleIndex, localPoint);
      const points = sprite.points.map((point, index) =>
        index === handleIndex ? constrainedPoint : point,
      );
      return normalizeSprite({ ...sprite, points });
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

const appendPoint = (sprite: Sprite) => {
  const last = sprite.points[sprite.points.length - 1];
  const previous = sprite.points[sprite.points.length - 2] ?? { x: last.x - 30, y: last.y };

  const direction = { x: last.x - previous.x, y: last.y - previous.y };
  const directionLength = Math.hypot(direction.x, direction.y) || 1;

  const nextPoint = {
    x: last.x + (direction.x / directionLength) * APPEND_STEP,
    y: last.y + (direction.y / directionLength) * APPEND_STEP,
  };

  return [...sprite.points, nextPoint];
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

const addPointWithStrategy = (sprite: Sprite, strategy: AddPointStrategy): Point[] => {
  if (sprite.points.length === 0) return sprite.points;

  if (strategy.type === "append") {
    return appendPoint(sprite);
  }

  if (strategy.type === "midpoint") {
    const index = Math.max(0, Math.min(sprite.points.length - 2, strategy.index));
    const a = sprite.points[index];
    const b = sprite.points[index + 1];
    return insertPoint(sprite.points, index, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  }

  const segmentIndex = findClosestSegmentIndex(sprite.points, strategy.point, strategy.tolerance);
  if (segmentIndex < 0) return sprite.points;
  const projected = closestPointOnSegment(
    strategy.point,
    sprite.points[segmentIndex],
    sprite.points[segmentIndex + 1],
  );
  return insertPoint(sprite.points, segmentIndex, projected);
};

export const addPoint = (
  sliceState: SliceState,
  spriteId: string,
  strategy: AddPointStrategy,
): SliceState => ({
  ...sliceState,
  sprites: sliceState.sprites.map((sprite) => {
    if (sprite.id !== spriteId) return sprite;
    return normalizeSprite({
      ...sprite,
      points: addPointWithStrategy(sprite, strategy),
    });
  }),
});

export const removePoint = (
  sliceState: SliceState,
  spriteId: string,
  mode: "last" | { index: number } = "last",
): SliceState => ({
  ...sliceState,
  sprites: sliceState.sprites.map((sprite) => {
    if (sprite.id !== spriteId || sprite.points.length <= 2) return sprite;

    if (mode === "last") {
      return normalizeSprite({ ...sprite, points: sprite.points.slice(0, -1) });
    }

    if (mode.index <= 0 || mode.index >= sprite.points.length - 1) return sprite;
    return normalizeSprite({
      ...sprite,
      points: [...sprite.points.slice(0, mode.index), ...sprite.points.slice(mode.index + 1)],
    });
  }),
});

export const setSpriteEnabled = (
  sliceState: SliceState,
  spriteId: string,
  enabled: boolean,
): SliceState => ({
  ...sliceState,
  sprites: sliceState.sprites.map((sprite) =>
    sprite.id === spriteId ? { ...sprite, enabled } : sprite,
  ),
});

export type AxisConstraintMode = "none" | "endpoints-on-axis";

export const getSpriteAxisConstraintMode = (sprite: Sprite): AxisConstraintMode =>
  sprite.constraints?.endpointOnSymmetryAxis ? "endpoints-on-axis" : "none";

export const setSpriteAxisConstraintMode = (
  sliceState: SliceState,
  spriteId: string,
  mode: AxisConstraintMode,
): SliceState => ({
  ...sliceState,
  sprites: sliceState.sprites.map((sprite) => {
    if (sprite.id !== spriteId) return sprite;

    const nextSprite: Sprite = {
      ...sprite,
      constraints: {
        ...sprite.constraints,
        endpointOnSymmetryAxis: mode === "endpoints-on-axis",
        snapToAxisThresholdPx:
          mode === "endpoints-on-axis"
            ? (sprite.constraints?.snapToAxisThresholdPx ?? DEFAULT_AXIS_SNAP_THRESHOLD)
            : undefined,
      },
    };

    return normalizeSprite(nextSprite);
  }),
});

export const setActiveSprite = (sliceState: SliceState, spriteId: string): SliceState => {
  const exists = sliceState.sprites.some((sprite) => sprite.id === spriteId);
  return exists ? { ...sliceState, activeSpriteId: spriteId } : sliceState;
};

export const addSprite = (sliceState: SliceState): SliceState => {
  const sprite = normalizeSprite(createDefaultSprite());
  return {
    activeSpriteId: sprite.id,
    sprites: [...sliceState.sprites, sprite],
  };
};

export const removeSprite = (sliceState: SliceState, spriteId: string): SliceState => {
  if (sliceState.sprites.length <= 1) return sliceState;

  const sprites = sliceState.sprites.filter((sprite) => sprite.id !== spriteId);
  if (sprites.length === sliceState.sprites.length) return sliceState;

  const nextActive =
    sliceState.activeSpriteId === spriteId
      ? (sprites[0]?.id ?? sliceState.activeSpriteId)
      : sliceState.activeSpriteId;

  return {
    activeSpriteId: nextActive,
    sprites,
  };
};
