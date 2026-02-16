"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BASE_ORIENTATION_DEG,
  DEFAULT_BASE_LINE,
  DEFAULT_LINE_THICKNESS,
  DEFAULT_ORDER,
  DEFAULT_TILING_RINGS,
  DEFAULT_TILING_SPACING,
  LEVEL_META,
} from "./rosette/constants";
import { RosetteControlsPanel } from "./rosette/components/RosetteControlsPanel";
import { EditingBadge } from "./rosette/components/EditingBadge";
import { RosetteCanvas } from "./rosette/components/RosetteCanvas";
import { buildRosetteCurvesLocal, transformCurvesToCenter } from "./rosette/domains/rosette";
import { addHandlePoint, removeHandlePoint, updateBaseHandleLocal } from "./rosette/domains/shape";
import { buildTilingCells } from "./rosette/domains/tessellation";
import { toRad } from "./rosette/math";
import { EditorLevel, Point, Size, TilingLattice } from "./rosette/types";

export function RosetteMechanism() {
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
      setSize({ width: container.clientWidth, height: container.clientHeight });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const center = useMemo(() => ({ x: size.width / 2, y: size.height / 2 }), [size]);
  const baseRotation = useMemo(() => toRad(BASE_ORIENTATION_DEG), []);

  const rosetteCurvesLocal = useMemo(
    () => buildRosetteCurvesLocal(baseLinePoints, order, baseRotation, mirrorAdjacency),
    [baseLinePoints, order, baseRotation, mirrorAdjacency],
  );

  const transformedCurves = useMemo(
    () => transformCurvesToCenter(rosetteCurvesLocal, center),
    [rosetteCurvesLocal, center],
  );

  const activeBaseCurve = transformedCurves[0] ?? [];

  const tilingCells = useMemo(
    () => buildTilingCells(tilingLattice, tilingRings, tilingSpacing),
    [tilingLattice, tilingRings, tilingSpacing],
  );

  const updateBaseHandle = (handleIndex: number, globalPoint: Point) => {
    if (editorLevel !== "shape") return;
    setBaseLinePoints((current) =>
      updateBaseHandleLocal(current, handleIndex, globalPoint, center, baseRotation),
    );
  };

  const addHandle = () => editorLevel === "shape" && setBaseLinePoints((current) => addHandlePoint(current));
  const removeHandle = () =>
    editorLevel === "shape" && setBaseLinePoints((current) => removeHandlePoint(current));

  const resetShape = () => setBaseLinePoints(DEFAULT_BASE_LINE);
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

  const activeMeta = LEVEL_META[editorLevel];

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <RosetteControlsPanel
        editorLevel={editorLevel}
        setEditorLevel={setEditorLevel}
        order={order}
        setOrder={setOrder}
        lineThickness={lineThickness}
        setLineThickness={setLineThickness}
        mirrorAdjacency={mirrorAdjacency}
        setMirrorAdjacency={setMirrorAdjacency}
        baseLinePointsLength={baseLinePoints.length}
        addHandle={addHandle}
        removeHandle={removeHandle}
        resetShape={resetShape}
        resetRosette={resetRosette}
        tilingLattice={tilingLattice}
        setTilingLattice={setTilingLattice}
        tilingRings={tilingRings}
        setTilingRings={setTilingRings}
        tilingSpacing={tilingSpacing}
        setTilingSpacing={setTilingSpacing}
        interCellRotation={interCellRotation}
        setInterCellRotation={setInterCellRotation}
        resetTiling={resetTiling}
        resetAll={resetAll}
      />

      <EditingBadge activeMeta={activeMeta} />

      <RosetteCanvas
        size={size}
        center={center}
        order={order}
        lineThickness={lineThickness}
        editorLevel={editorLevel}
        transformedCurves={transformedCurves}
        rosetteCurvesLocal={rosetteCurvesLocal}
        activeBaseCurve={activeBaseCurve}
        tilingCells={tilingCells}
        interCellRotation={interCellRotation}
        onHandleDrag={updateBaseHandle}
      />
    </div>
  );
}
