import { ALLOWED_ORDERS } from "./constants";
import { Point } from "./types";

export const snapOrder = (value: number) =>
  ALLOWED_ORDERS.reduce(
    (closest, current) =>
      Math.abs(current - value) < Math.abs(closest - value) ? current : closest,
    ALLOWED_ORDERS[0],
  );

export const toRad = (angle: number) => (angle * Math.PI) / 180;

export const rotatePoint = (point: Point, angle: number): Point => ({
  x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
  y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
});

export const flattenPoints = (points: Point[]) => points.flatMap((point) => [point.x, point.y]);
