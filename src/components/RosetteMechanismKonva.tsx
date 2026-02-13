"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Layer, Line, Stage } from "react-konva";

type Size = {
  width: number;
  height: number;
};

type Point = {
  x: number;
  y: number;
};

type EditorLevel = "shape" | "rosette" | "tessellation";

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

const LEVEL_META: Record<
  EditorLevel,
  {
    title: string;
    shortTitle: string;
    description: string;
    buttonClass: string;
    badgeClass: string;
    accentTextClass: string;
  }
> = {
  shape: {
    title: "Level 1 — Shape",
    shortTitle: "L1 Shape",
    description: "Edit the seed geometry only (handles and base curve).",
    buttonClass: "border-amber-400/70 bg-amber-500/15 text-amber-200",
    badgeClass: "border-amber-400/70 bg-amber-500/15 text-amber-200",
    accentTextClass: "text-amber-300",
  },
  rosette: {
    title: "Level 2 — Rosette",
    shortTitle: "L2 Rosette",
    description: "Edit replication rules (order, mirror and motif style).",
    buttonClass: "border-cyan-400/70 bg-cyan-500/15 text-cyan-200",
    badgeClass: "border-cyan-400/70 bg-cyan-500/15 text-cyan-200",
    accentTextClass: "text-cyan-300",
  },
  tessellation: {
    title: "Level 3 — Tessellation",
    shortTitle: "L3 Tessellation",
    description: "Compose repeated rosette cells into larger tiled patterns.",
    buttonClass: "border-violet-400/70 bg-violet-500/15 text-violet-200",
    badgeClass: "border-violet-400/70 bg-violet-500/15 text-violet-200",
    accentTextClass: "text-violet-300",
  },
};

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

  const [editorLevel, setEditorLevel] = useState<EditorLevel>("shape");

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

  const isShapeLevel = editorLevel === "shape";
  const isRosetteLevel = editorLevel === "rosette";
  const isTessellationLevel = editorLevel === "tessellation";

  const tessellationOffsets = useMemo(() => {
    const spacing = Math.min(size.width, size.height) * 0.42;

    return [
      { x: 0, y: 0 },
      { x: -spacing, y: 0 },
      { x: spacing, y: 0 },
      { x: -spacing / 2, y: -spacing * 0.86 },
      { x: spacing / 2, y: -spacing * 0.86 },
      { x: -spacing / 2, y: spacing * 0.86 },
      { x: spacing / 2, y: spacing * 0.86 },
    ];
  }, [size.height, size.width]);

  const updateBaseHandle = (handleIndex: number, globalPoint: Point) => {
    if (!isShapeLevel) return;

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
    if (!isShapeLevel) return;

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
    if (!isShapeLevel) return;
    setBaseLinePoints((current) => (current.length > 2 ? current.slice(0, -1) : current));
  };

  const resetShape = () => {
    setBaseLinePoints(DEFAULT_BASE_LINE);
  };

  const resetRosette = () => {
    setOrder(DEFAULT_ORDER);
    setLineThickness(DEFAULT_LINE_THICKNESS);
    setMirrorAdjacency(true);
  };

  const resetAll = () => {
    resetShape();
    resetRosette();
    setEditorLevel("shape");
  };

  const guideStroke = isRosetteLevel ? "#22d3ee" : "#334155";
  const guideOpacity = isRosetteLevel ? 0.7 : isShapeLevel ? 0.3 : 0.2;
  const motifStroke = isTessellationLevel ? "#c084fc" : "#67e8f9";
  const motifOpacity = isRosetteLevel ? 0.78 : isShapeLevel ? 0.28 : 0.42;
  const baseOpacity = isShapeLevel ? 1 : 0.4;
  const centerColor = isShapeLevel ? "#f59e0b" : isRosetteLevel ? "#2dd4bf" : "#c084fc";

  const activeMeta = LEVEL_META[editorLevel];

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <div className="pointer-events-none absolute left-4 top-4 z-10 w-[27rem] rounded-md border border-zinc-600/80 bg-zinc-900/85 p-3 text-zinc-100 shadow-lg backdrop-blur-sm">
        <div className="mb-2">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
            Kinetic Rosette — Multi-Level Editor
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Separate edits by level: base shape, rosette rules, and tessellation composition.
          </p>
        </div>

        <div className="pointer-events-auto mt-3 space-y-3">
          <div className="rounded-md border border-zinc-700 bg-zinc-950/50 p-1">
            <div className="grid grid-cols-3 gap-1">
              {(Object.keys(LEVEL_META) as EditorLevel[]).map((level) => {
                const levelMeta = LEVEL_META[level];
                const isActive = editorLevel === level;

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEditorLevel(level)}
                    className={`rounded border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                      isActive
                        ? levelMeta.buttonClass
                        : "border-zinc-700 bg-zinc-900/70 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    {levelMeta.shortTitle}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-md border border-zinc-700/90 bg-zinc-950/45 p-2">
            <p className={`text-xs font-semibold ${activeMeta.accentTextClass}`}>{activeMeta.title}</p>
            <p className="mt-1 text-[11px] text-zinc-400">{activeMeta.description}</p>
          </div>

          {isShapeLevel && (
            <>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={addHandle}
                  className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800"
                >
                  Add handle
                </button>
                <button
                  type="button"
                  onClick={removeHandle}
                  disabled={baseLinePoints.length <= 2}
                  className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove handle
                </button>
                <span className="text-xs text-zinc-400">handles: {baseLinePoints.length}</span>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={resetShape}
                  className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800"
                >
                  Reset shape
                </button>
              </div>
            </>
          )}

          {isRosetteLevel && (
            <>
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
                  className="w-full accent-cyan-400"
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
                  className="h-4 w-4 accent-cyan-400"
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
                  className="w-full accent-cyan-400"
                  aria-label="Rosette line thickness"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={resetRosette}
                  className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800"
                >
                  Reset rosette
                </button>
              </div>
            </>
          )}

          {isTessellationLevel && (
            <div className="space-y-2 rounded-md border border-violet-500/35 bg-violet-950/20 p-2">
              <p className="text-xs text-violet-200">Tessellation controls are next.</p>
              <p className="text-[11px] text-violet-200/75">
                Planned controls: lattice type, spacing, inter-cell rotation and clipping.
              </p>
              <p className="text-[11px] text-zinc-400">
                This level already previews neighboring motif cells and locks lower-level interaction.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-zinc-700/70 pt-2">
            <p className="text-[11px] text-zinc-400">
              {isShapeLevel && "Drag amber handles to author the base seed curve."}
              {isRosetteLevel &&
                (mirrorAdjacency
                  ? "Mirrored neighbors ON: odd sectors are reflected."
                  : "Mirrored neighbors OFF: all sectors share orientation.")}
              {isTessellationLevel && "Preview mode for level-3 composition (coming next)."}
            </p>
            <button
              type="button"
              onClick={resetAll}
              className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800"
            >
              Reset all
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 z-10">
        <div className={`rounded-md border px-3 py-1.5 text-xs font-medium shadow ${activeMeta.badgeClass}`}>
          Editing: {activeMeta.title}
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
                  stroke={guideStroke}
                  strokeWidth={1}
                  dash={isRosetteLevel ? [5, 5] : [4, 7]}
                  opacity={guideOpacity}
                />
              );
            })}

            {transformedCurves.map((curve, index) => (
              <Line
                key={`curve-${index}`}
                points={flattenPoints(curve)}
                stroke={motifStroke}
                strokeWidth={lineThickness}
                lineCap="round"
                lineJoin="round"
                opacity={motifOpacity}
              />
            ))}

            {isTessellationLevel &&
              tessellationOffsets.slice(1).map((offset, offsetIndex) => (
                <Group key={`tess-preview-${offsetIndex}`}>
                  {transformedCurves.map((curve, curveIndex) => (
                    <Line
                      key={`tess-preview-${offsetIndex}-${curveIndex}`}
                      points={flattenPoints(
                        curve.map((point) => ({
                          x: point.x + offset.x,
                          y: point.y + offset.y,
                        })),
                      )}
                      stroke="#c084fc"
                      strokeWidth={Math.max(0.5, lineThickness - 0.4)}
                      lineCap="round"
                      lineJoin="round"
                      opacity={0.22}
                    />
                  ))}
                  <Circle
                    x={center.x + offset.x}
                    y={center.y + offset.y}
                    radius={3.5}
                    fill="#c084fc"
                    opacity={0.65}
                  />
                </Group>
              ))}

            {activeBaseCurve.length > 1 && (
              <>
                <Line
                  points={flattenPoints(activeBaseCurve)}
                  stroke="#f59e0b"
                  strokeWidth={lineThickness + 1.2}
                  lineCap="round"
                  lineJoin="round"
                  opacity={baseOpacity}
                />

                {isShapeLevel &&
                  activeBaseCurve.map((handle, handleIndex) => (
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

            <Circle x={center.x} y={center.y} radius={4.5} fill={centerColor} />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
