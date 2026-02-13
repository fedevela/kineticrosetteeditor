"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Layer, Line, Stage } from "react-konva";

type Size = {
  width: number;
  height: number;
};

type Point = {
  x: number;
  y: number;
};

const MIN_ORDER = 2;
const MAX_ORDER = 128;
const DEFAULT_ORDER = 8;
const ORDER_SNAP_BASE = 360;

const BASE_ORIENTATION_DEG = 95;
const MIN_LINE_THICKNESS = 0.5;
const MAX_LINE_THICKNESS = 12;
const DEFAULT_LINE_THICKNESS = 1.8;

const DEFAULT_BASE_LINE: Point[] = [
  { x: -80, y: 0 },
  { x: 0, y: -24 },
  { x: 80, y: 0 },
];

const ALLOWED_ORDERS = (() => {
  const powerOfTwoOrders: number[] = [];
  let current = MIN_ORDER;

  while (current <= MAX_ORDER) {
    powerOfTwoOrders.push(current);
    current *= 2;
  }

  const sixMultipleDivisors = Array.from(
    { length: MAX_ORDER - MIN_ORDER + 1 },
    (_, index) => index + MIN_ORDER,
  ).filter((value) => ORDER_SNAP_BASE % value === 0 && value % 6 === 0);

  return Array.from(new Set([...powerOfTwoOrders, ...sixMultipleDivisors])).sort((a, b) => a - b);
})();

const snapOrder = (value: number) =>
  ALLOWED_ORDERS.reduce(
    (closest, current) =>
      Math.abs(current - value) < Math.abs(closest - value) ? current : closest,
    ALLOWED_ORDERS[0],
  );

const toRad = (angle: number) => (angle * Math.PI) / 180;

const rotatePoint = (point: Point, angle: number): Point => ({
  x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
  y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
});

const flattenPoints = (points: Point[]) => points.flatMap((point) => [point.x, point.y]);

export function RosetteMechanismKonva() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [order, setOrder] = useState(DEFAULT_ORDER);
  const [lineThickness, setLineThickness] = useState(DEFAULT_LINE_THICKNESS);
  const [mirrorAdjacency, setMirrorAdjacency] = useState(true);
  const [baseLinePoints, setBaseLinePoints] = useState<Point[]>(DEFAULT_BASE_LINE);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const center = useMemo(
    () => ({ x: size.width / 2, y: size.height / 2 }),
    [size.height, size.width],
  );

  const baseRotation = useMemo(() => toRad(BASE_ORIENTATION_DEG), []);

  const transformedCurves = useMemo(() => {
    if (size.width === 0 || size.height === 0) return [];

    return Array.from({ length: order }, (_, index) => {
      const rotation = baseRotation + (index * 2 * Math.PI) / order;
      const mirrored = mirrorAdjacency && index % 2 === 1;

      return baseLinePoints.map((point) => {
        const mirroredPoint = mirrored ? { x: -point.x, y: point.y } : point;
        const rotated = rotatePoint(mirroredPoint, rotation);
        return { x: center.x + rotated.x, y: center.y + rotated.y };
      });
    });
  }, [baseLinePoints, baseRotation, center.x, center.y, mirrorAdjacency, order, size.height, size.width]);

  const activeBaseCurve = transformedCurves[0] ?? [];

  const updateBaseHandle = (handleIndex: number, globalPoint: Point) => {
    const centeredPoint = {
      x: globalPoint.x - center.x,
      y: globalPoint.y - center.y,
    };

    const localPoint = rotatePoint(centeredPoint, -baseRotation);

    setBaseLinePoints((current) =>
      current.map((point, index) => (index === handleIndex ? localPoint : point)),
    );
  };

  const addHandle = () => {
    setBaseLinePoints((current) => {
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
    });
  };

  const removeHandle = () => {
    setBaseLinePoints((current) => (current.length > 2 ? current.slice(0, -1) : current));
  };

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <div className="pointer-events-none absolute left-4 top-4 z-10 w-96 rounded-md border border-zinc-600/80 bg-zinc-900/85 p-3 text-zinc-100 shadow-lg backdrop-blur-sm">
        <div className="mb-2">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
            Kinetic Rosette — Reflected Base Curve
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            The yellow base line is the seed shape. It is reflected on alternating sectors and rotated by 360/n.
          </p>
        </div>

        <div className="pointer-events-auto mt-3 space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
              <label htmlFor="order-input">Order (n)</label>
              <span className="tabular-nums">{order}</span>
            </div>
            <input
              id="order-input"
              type="range"
              min={MIN_ORDER}
              max={MAX_ORDER}
              step={1}
              value={order}
              onChange={(event) => setOrder(snapOrder(Number(event.target.value)))}
              className="w-full accent-teal-400"
              aria-label="Rosette order"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <label htmlFor="mirror-adj" className="text-xs text-zinc-300">
              Mirror adjacent linkages
            </label>
            <input
              id="mirror-adj"
              type="checkbox"
              checked={mirrorAdjacency}
              onChange={(event) => setMirrorAdjacency(event.target.checked)}
              className="h-4 w-4 accent-teal-400"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
              <label htmlFor="line-thickness">Line thickness</label>
              <span className="tabular-nums">{lineThickness.toFixed(1)}</span>
            </div>
            <input
              id="line-thickness"
              type="range"
              min={MIN_LINE_THICKNESS}
              max={MAX_LINE_THICKNESS}
              step={0.1}
              value={lineThickness}
              onChange={(event) => setLineThickness(Number(event.target.value))}
              className="w-full accent-teal-400"
              aria-label="Rosette line thickness"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={addHandle}
              className="pointer-events-auto rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800"
            >
              Add handle
            </button>
            <button
              type="button"
              onClick={removeHandle}
              disabled={baseLinePoints.length <= 2}
              className="pointer-events-auto rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Remove handle
            </button>
            <span className="text-xs text-zinc-400">handles: {baseLinePoints.length}</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setOrder(DEFAULT_ORDER);
                setLineThickness(DEFAULT_LINE_THICKNESS);
                setMirrorAdjacency(true);
                setBaseLinePoints(DEFAULT_BASE_LINE);
              }}
              className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800"
            >
              Reset
            </button>
          </div>

          <p className="text-[11px] text-zinc-400">
            {mirrorAdjacency
              ? "Mirrored neighbors: odd sectors use a left-right reflection of the base line."
              : "Non-mirrored neighbors: all sectors use the same base line orientation."}
          </p>
        </div>
      </div>

      {size.width > 0 && size.height > 0 && (
        <Stage width={size.width} height={size.height}>
          <Layer>
            {Array.from({ length: order }, (_, index) => {
              const angle = (index * 2 * Math.PI) / order;
              const guideEnd = {
                x: center.x + Math.cos(angle) * Math.min(size.width, size.height) * 0.44,
                y: center.y + Math.sin(angle) * Math.min(size.width, size.height) * 0.44,
              };

              return (
                <Line
                  key={`guide-${index}`}
                  points={[center.x, center.y, guideEnd.x, guideEnd.y]}
                  stroke="#334155"
                  strokeWidth={1}
                  dash={[4, 6]}
                />
              );
            })}

            {transformedCurves.map((curve, index) => (
              <Line
                key={`curve-${index}`}
                points={flattenPoints(curve)}
                stroke="#67e8f9"
                strokeWidth={lineThickness}
                lineCap="round"
                lineJoin="round"
                opacity={0.72}
              />
            ))}

            {activeBaseCurve.length > 1 && (
              <>
                <Line
                  points={flattenPoints(activeBaseCurve)}
                  stroke="#f59e0b"
                  strokeWidth={lineThickness + 1.2}
                  lineCap="round"
                  lineJoin="round"
                />

                {activeBaseCurve.map((handle, handleIndex) => (
                  <Circle
                    key={`base-handle-${handleIndex}`}
                    x={handle.x}
                    y={handle.y}
                    radius={6}
                    fill="#f59e0b"
                    stroke="#111827"
                    strokeWidth={1.5}
                    draggable
                    onDragMove={(event) =>
                      updateBaseHandle(handleIndex, {
                        x: event.target.x(),
                        y: event.target.y(),
                      })
                    }
                  />
                ))}
              </>
            )}

            <Circle x={center.x} y={center.y} radius={4.5} fill="#2dd4bf" />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
