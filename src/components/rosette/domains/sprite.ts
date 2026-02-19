import { DEFAULT_BASE_LINE } from "../constants";
import { rotatePoint } from "../math";
import { BezierNodeRole, Point, SliceState, Sprite } from "../types";
import { Bezier } from "bezier-js";

const DEFAULT_AXIS_SNAP_THRESHOLD = 10;
const APPEND_STEP = 28;

const clonePoints = (points: Point[]) => points.map((point) => ({ ...point }));

const createSpriteId = () => `sprite-${Math.random().toString(36).slice(2, 10)}`;

export const createDefaultSprite = (id = createSpriteId()): Sprite => ({
  id,
  type: "polyline",
  points: clonePoints(DEFAULT_BASE_LINE),
  transform: {
    x: 0,
    y: 0,
    rotationDeg: 0,
    scale: 1,
  },
  bezierContext: {
    mode: "cubic",
    t: 0.5,
    lutSteps: 48,
    offset: 0,
    scale: 1,
  },
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

const getBezierNodeIndex = (sprite: Sprite, role: BezierNodeRole): number | null => {
  const pointsLength = sprite.points.length;
  if (pointsLength <= 0) return null;

  switch (role) {
    case "p0":
      return 0;
    case "p1":
      return pointsLength - 1;
    case "c0":
      return pointsLength >= 3 ? 1 : null;
    case "c1":
      return pointsLength >= 4 ? pointsLength - 2 : null;
  }
};

const applyEndpointAxisConstraint = (sprite: Sprite, handleIndex: number, point: Point): Point => {
  return point;
};

const applySnapToAxisConstraint = (sprite: Sprite, point: Point): Point => {
  return point;
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
  const withDefaults: Sprite = {
    ...sprite,
    transform: {
      x: sprite.transform?.x ?? 0,
      y: sprite.transform?.y ?? 0,
      rotationDeg: sprite.transform?.rotationDeg ?? 0,
      scale: sprite.transform?.scale ?? 1,
    },
    bezierContext: {
      mode: sprite.bezierContext?.mode ?? "cubic",
      t: sprite.bezierContext?.t ?? 0.5,
      lutSteps: sprite.bezierContext?.lutSteps ?? 48,
      offset: sprite.bezierContext?.offset ?? 0,
      scale: sprite.bezierContext?.scale ?? 1,
    },
  };

  return withDefaults;
};

export const getSpriteRenderablePoints = (sprite: Sprite): Point[] => {
  const normalized = normalizeSprite(sprite);
  const points = normalized.points;
  if (points.length <= 1) return points;

  const mode = normalized.bezierContext?.mode ?? "cubic";
  const lutSteps = Math.max(8, Math.floor(normalized.bezierContext?.lutSteps ?? 48));
  const bezierScale = normalized.bezierContext?.scale ?? 1;
  const offsetDistance = normalized.bezierContext?.offset ?? 0;

  let sampled: Point[] = points;
  try {
    if (mode === "quadratic" && points.length >= 3) {
      const q = new Bezier(points[0], points[1], points[2]);
      sampled = q.getLUT(lutSteps).map((point: { x: number; y: number }, index: number, arr: unknown[]) => {
        if (offsetDistance === 0 || arr.length <= 1) return { x: point.x, y: point.y };
        const t = index / (arr.length - 1);
        const projected = q.offset(t, offsetDistance);
        return { x: projected.x, y: projected.y };
      });
    }
    if (mode === "cubic" && points.length >= 4) {
      const c = new Bezier(points[0], points[1], points[2], points[3]);
      sampled = c.getLUT(lutSteps).map((point: { x: number; y: number }, index: number, arr: unknown[]) => {
        if (offsetDistance === 0 || arr.length <= 1) return { x: point.x, y: point.y };
        const t = index / (arr.length - 1);
        const projected = c.offset(t, offsetDistance);
        return { x: projected.x, y: projected.y };
      });
    }
  } catch {
    sampled = points;
  }

  return sampled.map((point) => ({
    x: point.x * bezierScale,
    y: point.y * bezierScale,
  }));
};

export const applySpriteTransform = (points: Point[], sprite: Sprite): Point[] => {
  const transform = sprite.transform ?? { x: 0, y: 0, rotationDeg: 0, scale: 1 };
  const angle = (transform.rotationDeg * Math.PI) / 180;
  return points.map((point) => {
    const scaled = { x: point.x * transform.scale, y: point.y * transform.scale };
    const rotated = rotatePoint(scaled, angle);
    return { x: rotated.x + transform.x, y: rotated.y + transform.y };
  });
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

export const updateBezierNodeLocal = (
  sliceState: SliceState,
  spriteId: string,
  role: BezierNodeRole,
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
      const handleIndex = getBezierNodeIndex(sprite, role);
      if (handleIndex == null) return sprite;
      const constrainedPoint = applyPointConstraints(sprite, handleIndex, localPoint);
      const points = sprite.points.map((point, index) =>
        index === handleIndex ? constrainedPoint : point,
      );
      return normalizeSprite({ ...sprite, points });
    }),
  };
};

export const getBezierNodePoint = (sprite: Sprite, role: BezierNodeRole): Point | null => {
  const index = getBezierNodeIndex(sprite, role);
  return index == null ? null : (sprite.points[index] ?? null);
};

export const getAvailableBezierNodeRoles = (sprite: Sprite): BezierNodeRole[] => {
  const roles: BezierNodeRole[] = ["p0"];
  if (sprite.points.length >= 3) roles.push("c0");
  if (sprite.points.length >= 4) roles.push("c1");
  roles.push("p1");
  return roles;
};

const closestPointOnSegment = (point: Point, a: Point, b: Point): Point => {
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

const findClosestSegmentIndex = (
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

type AddPointStrategy =
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
  strategy:
    | { type: "append" }
    | { type: "insert-on-segment"; point: Point; tolerance?: number }
    | { type: "midpoint"; index: number },
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

export const getSpriteAxisConstraintMode = (_sprite: Sprite): AxisConstraintMode => "none";

export const setSpriteAxisConstraintMode = (
  sliceState: SliceState,
  _spriteId: string,
  _mode: AxisConstraintMode,
): SliceState => sliceState;

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

export const updateSpriteTransform = (
  sliceState: SliceState,
  spriteId: string,
  patch: Partial<NonNullable<Sprite["transform"]>>,
): SliceState => ({
  ...sliceState,
  sprites: sliceState.sprites.map((sprite) => {
    if (sprite.id !== spriteId) return sprite;
    return normalizeSprite({
      ...sprite,
      transform: {
        x: patch.x ?? sprite.transform?.x ?? 0,
        y: patch.y ?? sprite.transform?.y ?? 0,
        rotationDeg: patch.rotationDeg ?? sprite.transform?.rotationDeg ?? 0,
        scale: patch.scale ?? sprite.transform?.scale ?? 1,
      },
    });
  }),
});

export const updateSpriteBezierContext = (
  sliceState: SliceState,
  spriteId: string,
  patch: Partial<NonNullable<Sprite["bezierContext"]>>,
): SliceState => ({
  ...sliceState,
  sprites: sliceState.sprites.map((sprite) => {
    if (sprite.id !== spriteId) return sprite;
    return normalizeSprite({
      ...sprite,
      bezierContext: {
        mode: patch.mode ?? sprite.bezierContext?.mode ?? "cubic",
        t: patch.t ?? sprite.bezierContext?.t ?? 0.5,
        lutSteps: patch.lutSteps ?? sprite.bezierContext?.lutSteps ?? 48,
        offset: patch.offset ?? sprite.bezierContext?.offset ?? 0,
        scale: patch.scale ?? sprite.bezierContext?.scale ?? 1,
      },
    });
  }),
});
