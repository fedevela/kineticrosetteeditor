"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Circle, Layer, Line, Stage } from "react-konva";

type Size = {
  width: number;
  height: number;
};

type Point = {
  x: number;
  y: number;
};

type Linkage = {
  A: Point;
  B: Point;
  C: Point;
  D: Point;
};

const MIN_ORDER = 2;
const MAX_ORDER = 128;
const DEFAULT_ORDER = 8;
const ORDER_SNAP_BASE = 360;

const MIN_INPUT_ANGLE = 1;
const MAX_INPUT_ANGLE = 360;
const DEFAULT_INPUT_ANGLE = 95;
const NON_MIRRORED_PHASE_OFFSET = 28;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const ALLOWED_ORDERS = Array.from(
  { length: MAX_ORDER - MIN_ORDER + 1 },
  (_, index) => index + MIN_ORDER,
).filter((value) => ORDER_SNAP_BASE % value === 0);

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

const circleIntersections = (
  c1: Point,
  r1: number,
  c2: Point,
  r2: number,
): [Point, Point] | null => {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const distance = Math.hypot(dx, dy);

  if (distance === 0) return null;
  if (distance > r1 + r2) return null;
  if (distance < Math.abs(r1 - r2)) return null;

  const a = (r1 ** 2 - r2 ** 2 + distance ** 2) / (2 * distance);
  const hSquared = r1 ** 2 - a ** 2;
  if (hSquared < 0) return null;

  const h = Math.sqrt(hSquared);
  const px = c1.x + (a * dx) / distance;
  const py = c1.y + (a * dy) / distance;

  const rx = (-dy * h) / distance;
  const ry = (dx * h) / distance;

  return [
    { x: px + rx, y: py + ry },
    { x: px - rx, y: py - ry },
  ];
};

const solveSymmetric4R = (
  inputAngleDeg: number,
  ground: number,
  crank: number,
  coupler: number,
): Linkage | null => {
  const theta = toRad(inputAngleDeg);

  const A = { x: -ground / 2, y: 0 };
  const D = { x: ground / 2, y: 0 };
  const B = {
    x: A.x + crank * Math.cos(theta),
    y: A.y + crank * Math.sin(theta),
  };

  const intersections = circleIntersections(B, coupler, D, crank);
  if (!intersections) return null;

  const C = intersections[0].y >= intersections[1].y ? intersections[0] : intersections[1];
  return { A, B, C, D };
};

export function RosetteMechanismKonva() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [order, setOrder] = useState(DEFAULT_ORDER);
  const [inputAngle, setInputAngle] = useState(DEFAULT_INPUT_ANGLE);
  const [mirrorAdjacency, setMirrorAdjacency] = useState(true);

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

  const petals = useMemo(() => {
    if (size.width === 0 || size.height === 0) return [];

    const minDimension = Math.min(size.width, size.height);
    const ground = minDimension * 0.11;
    const crank = ground * 0.8;
    const coupler = ground * 1.05;
    const ringRadius = minDimension * 0.25;
    const rosetteSpin = toRad(((inputAngle - MIN_INPUT_ANGLE) / (MAX_INPUT_ANGLE - MIN_INPUT_ANGLE)) * (160 / order));

    return Array.from({ length: order }, (_, index) => {
      const petalInputAngle = mirrorAdjacency
        ? inputAngle
        : clamp(
            inputAngle + (index % 2 === 0 ? 0 : NON_MIRRORED_PHASE_OFFSET),
            MIN_INPUT_ANGLE,
            MAX_INPUT_ANGLE,
          );

      const localLinkage = solveSymmetric4R(petalInputAngle, ground, crank, coupler);
      if (!localLinkage) return null;

      const rotation = (index * 2 * Math.PI) / order + rosetteSpin;
      const mirrored = mirrorAdjacency && index % 2 === 1;

      const toGlobal = (point: Point): Point => {
        const mirroredPoint = mirrored ? { x: -point.x, y: point.y } : point;
        const lifted = { x: mirroredPoint.x, y: mirroredPoint.y + ringRadius };
        const rotated = rotatePoint(lifted, rotation);
        return { x: center.x + rotated.x, y: center.y + rotated.y };
      };

      return {
        index,
        A: toGlobal(localLinkage.A),
        B: toGlobal(localLinkage.B),
        C: toGlobal(localLinkage.C),
        D: toGlobal(localLinkage.D),
      };
    }).filter((petal): petal is NonNullable<typeof petal> => petal !== null);
  }, [center.x, center.y, inputAngle, mirrorAdjacency, order, size.height, size.width]);

  const connectors = useMemo(() => {
    if (petals.length < 2) return [] as Point[][];

    const joints: Point[][] = [];
    for (let i = 0; i < petals.length - 1; i += 1) {
      const current = petals[i];
      const next = petals[i + 1];

      joints.push([current.B, next.D]);
      joints.push([current.C, next.A]);
    }
    return joints;
  }, [petals]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <div className="pointer-events-none absolute left-4 top-4 z-10 w-96 rounded-md border border-zinc-600/80 bg-zinc-900/85 p-3 text-zinc-100 shadow-lg backdrop-blur-sm">
        <div className="mb-2">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
            Kinetic Rosette — Basic 4R Approximation
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            n repeated doubly-symmetrical 4R linkages. Mirrored adjacency keeps petals folding in sync.
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

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
              <label htmlFor="input-angle">Input angle (single-DOF)</label>
              <span className="tabular-nums">{inputAngle.toFixed(0)}°</span>
            </div>
            <input
              id="input-angle"
              type="range"
              min={MIN_INPUT_ANGLE}
              max={MAX_INPUT_ANGLE}
              step={1}
              value={inputAngle}
              onChange={(event) => setInputAngle(Number(event.target.value))}
              className="w-full accent-teal-400"
              aria-label="4R input angle"
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

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setOrder(DEFAULT_ORDER);
                setInputAngle(DEFAULT_INPUT_ANGLE);
                setMirrorAdjacency(true);
              }}
              className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800"
            >
              Reset
            </button>
          </div>

          <p className="text-[11px] text-zinc-400">
            {mirrorAdjacency
              ? "Mirrored neighbors: petals fold harmoniously (same input angle)."
              : "Non-mirrored neighbors: a phase offset is introduced to show desynchronized folding."}
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

            {connectors.map((jointPair, index) => (
              <Line
                key={`connector-${index}`}
                points={flattenPoints(jointPair)}
                stroke="#14b8a6"
                strokeWidth={1.5}
                dash={[5, 5]}
                opacity={0.65}
              />
            ))}

            {petals.map((petal) => (
              <Fragment key={`petal-${petal.index}`}>
                <Line
                  key={`fill-${petal.index}`}
                  points={flattenPoints([petal.A, petal.B, petal.C, petal.D])}
                  closed
                  fill="#22d3ee22"
                  stroke="#67e8f9"
                  strokeWidth={1.25}
                />

                <Line
                  key={`ab-${petal.index}`}
                  points={flattenPoints([petal.A, petal.B])}
                  stroke="#f8fafc"
                  strokeWidth={2.4}
                />
                <Line
                  key={`bc-${petal.index}`}
                  points={flattenPoints([petal.B, petal.C])}
                  stroke="#f8fafc"
                  strokeWidth={2.4}
                />
                <Line
                  key={`cd-${petal.index}`}
                  points={flattenPoints([petal.C, petal.D])}
                  stroke="#f8fafc"
                  strokeWidth={2.4}
                />
                <Line
                  key={`da-${petal.index}`}
                  points={flattenPoints([petal.D, petal.A])}
                  stroke="#f8fafc"
                  strokeWidth={2.4}
                />

                {[petal.A, petal.B, petal.C, petal.D].map((joint, jointIndex) => (
                  <Circle
                    key={`joint-${petal.index}-${jointIndex}`}
                    x={joint.x}
                    y={joint.y}
                    radius={3.5}
                    fill="#ffffff"
                  />
                ))}
              </Fragment>
            ))}

            <Circle x={center.x} y={center.y} radius={4.5} fill="#2dd4bf" />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
