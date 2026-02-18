import { Point } from "../types";
import { rotatePoint } from "../math";

export const buildRosetteCurvesFromSpritePolyline = (
  spritePolylinePoints: Point[],
  order: number,
  baseRotation: number,
  mirrorAdjacency: boolean,
) => {
  return Array.from({ length: order }, (_, index) => {
    const rotation = baseRotation + (index * 2 * Math.PI) / order;
    const mirrored = mirrorAdjacency && index % 2 === 1;

    return spritePolylinePoints.map((point) => {
      const mirroredPoint = mirrored ? { x: -point.x, y: point.y } : point;
      return rotatePoint(mirroredPoint, rotation);
    });
  });
};

export const buildRosetteCurvesFromSlice = (
  spritePolylines: Point[][],
  order: number,
  baseRotation: number,
  mirrorAdjacency: boolean,
) =>
  spritePolylines.flatMap((points) =>
    buildRosetteCurvesFromSpritePolyline(points, order, baseRotation, mirrorAdjacency),
  );

export const transformCurvesToCenter = (curves: Point[][], center: Point) =>
  curves.map((curve) =>
    curve.map((point) => ({
      x: center.x + point.x,
      y: center.y + point.y,
    })),
  );
