import { Point, Viewport } from "./types";

export const MIN_VIEWPORT_SCALE = 0.2;
export const MAX_VIEWPORT_SCALE = 8;

export const clampScale = (
  scale: number,
  min = MIN_VIEWPORT_SCALE,
  max = MAX_VIEWPORT_SCALE,
) => Math.min(max, Math.max(min, scale));

export const screenToWorld = (screenPoint: Point, viewport: Viewport): Point => ({
  x: (screenPoint.x - viewport.offset.x) / viewport.scale,
  y: (screenPoint.y - viewport.offset.y) / viewport.scale,
});

export const worldToScreen = (worldPoint: Point, viewport: Viewport): Point => ({
  x: worldPoint.x * viewport.scale + viewport.offset.x,
  y: worldPoint.y * viewport.scale + viewport.offset.y,
});

export const zoomToPoint = (viewport: Viewport, screenPoint: Point, nextScale: number): Viewport => {
  const safeScale = clampScale(nextScale);
  const worldPoint = screenToWorld(screenPoint, viewport);

  return {
    scale: safeScale,
    offset: {
      x: screenPoint.x - worldPoint.x * safeScale,
      y: screenPoint.y - worldPoint.y * safeScale,
    },
  };
};
