import { Point } from "../types";
import { rotatePoint } from "../math";

export const buildRosetteCurvesLocal = (
  baseLinePoints: Point[],
  order: number,
  baseRotation: number,
  mirrorAdjacency: boolean,
) => {
  return Array.from({ length: order }, (_, index) => {
    const rotation = baseRotation + (index * 2 * Math.PI) / order;
    const mirrored = mirrorAdjacency && index % 2 === 1;

    return baseLinePoints.map((point) => {
      const mirroredPoint = mirrored ? { x: -point.x, y: point.y } : point;
      return rotatePoint(mirroredPoint, rotation);
    });
  });
};

export const transformCurvesToCenter = (curves: Point[][], center: Point) =>
  curves.map((curve) =>
    curve.map((point) => ({
      x: center.x + point.x,
      y: center.y + point.y,
    })),
  );
