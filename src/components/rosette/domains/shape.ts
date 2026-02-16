import { DEFAULT_BASE_LINE } from "../constants";
import { rotatePoint } from "../math";
import { Point } from "../types";

export const updateBaseHandleLocal = (
  current: Point[],
  handleIndex: number,
  globalPoint: Point,
  center: Point,
  baseRotation: number,
) => {
  const centeredPoint = {
    x: globalPoint.x - center.x,
    y: globalPoint.y - center.y,
  };

  const localPoint = rotatePoint(centeredPoint, -baseRotation);
  return current.map((point, index) => (index === handleIndex ? localPoint : point));
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
