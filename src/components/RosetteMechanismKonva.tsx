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

type EditorLevel = "shape" | "rosette" | "tiling";
type TilingLattice = "hex" | "square";

const ALLOWED_ORDERS = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const MIN_ORDER = ALLOWED_ORDERS[0];
const MAX_ORDER = ALLOWED_ORDERS[ALLOWED_ORDERS.length - 1];
const DEFAULT_ORDER = 8;

const BASE_ORIENTATION_DEG = 95;
const MIN_LINE_THICKNESS = 0.5;
const MAX_LINE_THICKNESS = 12;
const DEFAULT_LINE_THICKNESS = 1.8;
const MIN_TILING_SPACING = 80;
const MAX_TILING_SPACING = 460;
const DEFAULT_TILING_SPACING = 220;
const MIN_TILING_RINGS = 1;
const MAX_TILING_RINGS = 4;
const DEFAULT_TILING_RINGS = 1;

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
  tiling: {
    title: "Level 3 — Tiling",
    shortTitle: "L3 Tiling",
    description: "Compose repeated rosette cells into larger tiled patterns.",
    buttonClass: "border-violet-400/70 bg-violet-500/15 text-violet-200",
    badgeClass: "border-violet-400/70 bg-violet-500/15 text-violet-200",
    accentTextClass: "text-violet-300",
  },
};

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
  const [tilingLattice, setTilingLattice] = useState<TilingLattice>("hex");
  const [tilingSpacing, setTilingSpacing] = useState(DEFAULT_TILING_SPACING);
  const [tilingRings, setTilingRings] = useState(DEFAULT_TILING_RINGS);
  const [interCellRotation, setInterCellRotation] = useState(0);

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

  const rosetteCurvesLocal = useMemo(() => {
    if (size.width === 0 || size.height === 0) return [];

    return Array.from({ length: order }, (_, index) => {
      const rotation = baseRotation + (index * 2 * Math.PI) / order;
      const mirrored = mirrorAdjacency && index % 2 === 1;

      return baseLinePoints.map((point) => {
        const mirroredPoint = mirrored ? { x: -point.x, y: point.y } : point;
        return rotatePoint(mirroredPoint, rotation);
      });
    });
  }, [baseLinePoints, baseRotation, mirrorAdjacency, order, size.height, size.width]);

  const transformedCurves = useMemo(
    () =>
      rosetteCurvesLocal.map((curve) =>
        curve.map((point) => ({ x: center.x + point.x, y: center.y + point.y })),
      ),
    [center.x, center.y, rosetteCurvesLocal],
  );

  const activeBaseCurve = transformedCurves[0] ?? [];

  const isShapeLevel = editorLevel === "shape";
  const isRosetteLevel = editorLevel === "rosette";
  const isTilingLevel = editorLevel === "tiling";

  const tilingCells = useMemo(() => {
    const spacing = tilingSpacing;

    if (tilingLattice === "square") {
      return Array.from({ length: tilingRings * 2 + 1 }, (_, rowOffset) => {
        const row = rowOffset - tilingRings;

        return Array.from({ length: tilingRings * 2 + 1 }, (_, colOffset) => {
          const col = colOffset - tilingRings;
          const ring = Math.max(Math.abs(row), Math.abs(col));

          return {
            x: col * spacing,
            y: row * spacing,
            ring,
          };
        });
      }).flat();
    }

    const sin60 = Math.sqrt(3) / 2;
    const cells: Array<{ x: number; y: number; ring: number }> = [];

    for (let r = -tilingRings; r <= tilingRings; r += 1) {
      for (let q = -tilingRings; q <= tilingRings; q += 1) {
        const s = -q - r;
        const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
        if (ring > tilingRings) continue;

        cells.push({
          x: spacing * (q + r / 2),
          y: spacing * sin60 * r,
          ring,
        });
      }
    }

    return cells;
  }, [tilingLattice, tilingRings, tilingSpacing]);

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

  const resetTiling = () => {
    setTilingLattice("hex");
    setTilingSpacing(DEFAULT_TILING_SPACING);
    setTilingRings(DEFAULT_TILING_RINGS);
    setInterCellRotation(0);
  };

  const resetAll = () => {
    resetShape();
    resetRosette();
    resetTiling();
    setEditorLevel("shape");
  };

  const guideStroke = isRosetteLevel ? "#22d3ee" : isTilingLevel ? "#a855f7" : "#334155";
  const guideOpacity = isRosetteLevel ? 0.7 : isShapeLevel ? 0.3 : 0.22;
  const motifStroke = isTilingLevel ? "#c084fc" : "#67e8f9";
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
            Separate edits by level: base shape, rosette rules, and tiling composition.
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

          {isTilingLevel && (
            <div className="space-y-2 rounded-md border border-violet-500/35 bg-violet-950/20 p-2">
              <p className="text-xs text-violet-200">Tiling controls</p>

              <div className="grid grid-cols-2 gap-1">
                {([
                  ["hex", "Hex lattice"],
                  ["square", "Square grid"],
                ] as const).map(([value, label]) => {
                  const active = tilingLattice === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTilingLattice(value)}
                      className={`rounded border px-2 py-1 text-[11px] transition-colors ${
                        active
                          ? "border-violet-300/80 bg-violet-500/25 text-violet-100"
                          : "border-violet-800/60 bg-violet-950/30 text-violet-200/80 hover:border-violet-500/70"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                  <label htmlFor="tiling-rings">Expansion rings</label>
                  <span className="tabular-nums">{tilingRings}</span>
                </div>
                <input
                  id="tiling-rings"
                  type="range"
                  min={MIN_TILING_RINGS}
                  max={MAX_TILING_RINGS}
                  step={1}
                  value={tilingRings}
                  onChange={(event) => setTilingRings(Number(event.target.value))}
                  className="w-full accent-violet-400"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                  <label htmlFor="tiling-spacing">Cell spacing</label>
                  <span className="tabular-nums">{tilingSpacing}</span>
                </div>
                <input
                  id="tiling-spacing"
                  type="range"
                  min={MIN_TILING_SPACING}
                  max={MAX_TILING_SPACING}
                  step={2}
                  value={tilingSpacing}
                  onChange={(event) => setTilingSpacing(Number(event.target.value))}
                  className="w-full accent-violet-400"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                  <label htmlFor="inter-cell-rotation">Inter-cell rotation</label>
                  <span className="tabular-nums">{interCellRotation}°</span>
                </div>
                <input
                  id="inter-cell-rotation"
                  type="range"
                  min={-30}
                  max={30}
                  step={1}
                  value={interCellRotation}
                  onChange={(event) => setInterCellRotation(Number(event.target.value))}
                  className="w-full accent-violet-400"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={resetTiling}
                  className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800"
                >
                  Reset tiling
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-zinc-700/70 pt-2">
            <p className="text-[11px] text-zinc-400">
              {isShapeLevel && "Drag amber handles to author the base seed curve."}
              {isRosetteLevel &&
                (mirrorAdjacency
                  ? "Mirrored neighbors ON: odd sectors are reflected."
                  : "Mirrored neighbors OFF: all sectors share orientation.")}
              {isTilingLevel &&
                `Tiling ${tilingLattice} layout · rings ${tilingRings} · spacing ${tilingSpacing}.`}
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

            {!isTilingLevel &&
              transformedCurves.map((curve, index) => (
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

            {isTilingLevel &&
              tilingCells.map((cell, cellIndex) => {
                const cellRotation = toRad(interCellRotation * cell.ring);
                const cellOpacity = Math.max(0.2, 0.8 - cell.ring * 0.12);

                return (
                  <Group key={`tiling-cell-${cellIndex}`}>
                    {rosetteCurvesLocal.map((curve, curveIndex) => (
                      <Line
                        key={`tiling-cell-${cellIndex}-${curveIndex}`}
                        points={flattenPoints(
                          curve.map((point) => {
                            const orientedPoint =
                              cellRotation === 0 ? point : rotatePoint(point, cellRotation);

                            return {
                              x: center.x + cell.x + orientedPoint.x,
                              y: center.y + cell.y + orientedPoint.y,
                            };
                          }),
                        )}
                        stroke="#c084fc"
                        strokeWidth={Math.max(0.55, lineThickness - 0.25)}
                        lineCap="round"
                        lineJoin="round"
                        opacity={cellOpacity}
                      />
                    ))}

                    <Circle
                      x={center.x + cell.x}
                      y={center.y + cell.y}
                      radius={cell.ring === 0 ? 3.6 : 2.8}
                      fill="#c084fc"
                      opacity={cell.ring === 0 ? 0.8 : 0.4}
                    />
                  </Group>
                );
              })}

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
