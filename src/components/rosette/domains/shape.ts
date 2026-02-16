import { DEFAULT_BASE_LINE } from "../constants";
import { rotatePoint } from "../math";
import { Point } from "../types";

export const constrainBaseLineToSymmetricalAxis = (points: Point[]) => {
  if (points.length === 0) return points;

  return points.map((point, index) => {
    if (index === 0) return { x: 0, y: point.y };
    if (index === points.length - 1) return { x: 0, y: point.y };
    return point;
  });
};

export const updateBaseHandleLocal = (
  current: Point[],
  handleIndex: number,
  globalPoint: Point,
  center: Point,
  baseRotation: number,
  limitMovementToSymmetricalAxis: boolean,
) => {
  const centeredPoint = {
    x: globalPoint.x - center.x,
    y: globalPoint.y - center.y,
  };

  const localPoint = rotatePoint(centeredPoint, -baseRotation);

  const constrainedPoint = limitMovementToSymmetricalAxis
    ? handleIndex === 0
      ? { x: 0, y: localPoint.y }
      : handleIndex === current.length - 1
        ? { x: 0, y: localPoint.y }
        : localPoint
    : localPoint;

  const updated = current.map((point, index) => (index === handleIndex ? constrainedPoint : point));
  return limitMovementToSymmetricalAxis ? constrainBaseLineToSymmetricalAxis(updated) : updated;
};

export const addHandlePoint = (current: Point[]) => {
  const last = current[current.length - 1];
  const previous = current[current.length - 2] ?? { x: last.x - 30, y: last.y };

  const direction = { x: last.x - previous.x, y: last.y - previous.y };
  const directionLength = Math.hypot(direction.x, direction.y) || 1;
  const step = 28;

  const nextPoint = {
    x: last.x + (direction.x / directionLength) * step,
    y: last.y + (direction.y / directionLength) * step,
  };

  return [...current, nextPoint];
};

export const removeHandlePoint = (current: Point[]) =>
  current.length > 2 ? current.slice(0, -1) : current;

export const resetShapeState = () => DEFAULT_BASE_LINE;
