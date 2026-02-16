"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BASE_ORIENTATION_DEG,
  DEFAULT_FOLD_PROGRESS,
  DEFAULT_BASE_LINE,
  DEFAULT_TESSELLATION_BRANCH_ORDER,
  DEFAULT_TESSELLATION_SYMMETRY,
  DEFAULT_LINE_THICKNESS,
  DEFAULT_ORDER,
  DEFAULT_TILING_RINGS,
  DEFAULT_TILING_SPACING,
  LEVEL_META,
  MAX_BASE_ORIENTATION_DEG,
  MIN_BASE_ORIENTATION_DEG,
} from "./rosette/constants";
import { RosetteControlsPanel } from "./rosette/components/RosetteControlsPanel";
import { EditingBadge } from "./rosette/components/EditingBadge";
import { RosetteCanvas } from "./rosette/components/RosetteCanvas";
import { buildRosetteCurvesLocal, transformCurvesToCenter } from "./rosette/domains/rosette";
import {
  addHandlePoint,
  constrainBaseLineToSymmetricalAxis,
  removeHandlePoint,
  updateBaseHandleLocal,
} from "./rosette/domains/shape";
import { buildTessellationMechanism, buildTilingCells } from "./rosette/domains/tessellation";
import { toRad } from "./rosette/math";
import {
  EditorLevel,
  Point,
  Size,
  TessellationBranchOrder,
  TessellationSymmetry,
  TilingLattice,
} from "./rosette/types";

export function RosetteMechanism() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const [editorLevel, setEditorLevel] = useState<EditorLevel>("shape");
  const [order, setOrder] = useState(DEFAULT_ORDER);
  const [lineThickness, setLineThickness] = useState(DEFAULT_LINE_THICKNESS);
  const [baseOrientationDeg, setBaseOrientationDeg] = useState(BASE_ORIENTATION_DEG);
  const [mirrorAdjacency, setMirrorAdjacency] = useState(true);
  const [baseLinePoints, setBaseLinePoints] = useState<Point[]>(
    constrainBaseLineToSymmetricalAxis(DEFAULT_BASE_LINE),
  );
  const [limitMovementToSymmetricalAxis, setLimitMovementToSymmetricalAxis] = useState(true);
  const [tilingLattice, setTilingLattice] = useState<TilingLattice>("hex");
  const [tilingSpacing, setTilingSpacing] = useState(DEFAULT_TILING_SPACING);
  const [tilingRings, setTilingRings] = useState(DEFAULT_TILING_RINGS);
  const [interCellRotation, setInterCellRotation] = useState(0);
  const [tessellationSymmetry, setTessellationSymmetry] =
    useState<TessellationSymmetry>(DEFAULT_TESSELLATION_SYMMETRY);
  const [tessellationBranchOrder, setTessellationBranchOrder] =
    useState<TessellationBranchOrder>(DEFAULT_TESSELLATION_BRANCH_ORDER);
  const [foldProgress, setFoldProgress] = useState(DEFAULT_FOLD_PROGRESS);
  const [fixedCellId, setFixedCellId] = useState("0,0");

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
  const baseRotation = useMemo(() => toRad(baseOrientationDeg), [baseOrientationDeg]);

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

  const tessellationMechanism = useMemo(
    () =>
      buildTessellationMechanism({
        cells: tilingCells,
        order,
        baseOrientation: baseRotation,
        interCellRotation: toRad(interCellRotation) * foldProgress,
        symmetry: tessellationSymmetry,
        branchOrder: tessellationBranchOrder,
        fixedCellId: fixedCellId.trim() || undefined,
      }),
    [
      tilingCells,
      order,
      baseRotation,
      interCellRotation,
      foldProgress,
      tessellationSymmetry,
      tessellationBranchOrder,
      fixedCellId,
    ],
  );

  const updateBaseHandle = (handleIndex: number, globalPoint: Point) => {
    if (editorLevel !== "shape") return;
    setBaseLinePoints((current) =>
      updateBaseHandleLocal(
        current,
        handleIndex,
        globalPoint,
        center,
        baseRotation,
        limitMovementToSymmetricalAxis,
      ),
    );
  };

  const toggleLimitMovementToSymmetricalAxis = (enabled: boolean) => {
    setLimitMovementToSymmetricalAxis(enabled);
    if (enabled) {
      setBaseLinePoints((current) => constrainBaseLineToSymmetricalAxis(current));
    }
  };

  const addHandle = () =>
    editorLevel === "shape" &&
    setBaseLinePoints((current) => {
      const updated = addHandlePoint(current);
      return limitMovementToSymmetricalAxis
        ? constrainBaseLineToSymmetricalAxis(updated)
        : updated;
    });
  const removeHandle = () =>
    editorLevel === "shape" &&
    setBaseLinePoints((current) => {
      const updated = removeHandlePoint(current);
      return limitMovementToSymmetricalAxis
        ? constrainBaseLineToSymmetricalAxis(updated)
        : updated;
    });

  const resetShape = () => {
    setLimitMovementToSymmetricalAxis(true);
    setBaseLinePoints(constrainBaseLineToSymmetricalAxis(DEFAULT_BASE_LINE));
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
    setBaseOrientationDeg(BASE_ORIENTATION_DEG);
    setTessellationSymmetry(DEFAULT_TESSELLATION_SYMMETRY);
    setTessellationBranchOrder(DEFAULT_TESSELLATION_BRANCH_ORDER);
    setFoldProgress(DEFAULT_FOLD_PROGRESS);
    setFixedCellId("0,0");
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
        baseOrientationDeg={baseOrientationDeg}
        setBaseOrientationDeg={(value) =>
          setBaseOrientationDeg(Math.min(MAX_BASE_ORIENTATION_DEG, Math.max(MIN_BASE_ORIENTATION_DEG, value)))
        }
        mirrorAdjacency={mirrorAdjacency}
        setMirrorAdjacency={setMirrorAdjacency}
        limitMovementToSymmetricalAxis={limitMovementToSymmetricalAxis}
        setLimitMovementToSymmetricalAxis={toggleLimitMovementToSymmetricalAxis}
        baseLinePointsLength={baseLinePoints.length}
        addHandle={addHandle}
        removeHandle={removeHandle}
        resetShape={resetShape}
        resetRosette={resetRosette}
        tilingLattice={tilingLattice}
        setTilingLattice={setTilingLattice}
        tessellationSymmetry={tessellationSymmetry}
        setTessellationSymmetry={setTessellationSymmetry}
        tessellationBranchOrder={tessellationBranchOrder}
        setTessellationBranchOrder={setTessellationBranchOrder}
        tilingRings={tilingRings}
        setTilingRings={setTilingRings}
        tilingSpacing={tilingSpacing}
        setTilingSpacing={setTilingSpacing}
        interCellRotation={interCellRotation}
        setInterCellRotation={setInterCellRotation}
        foldProgress={foldProgress}
        setFoldProgress={setFoldProgress}
        fixedCellId={fixedCellId}
        setFixedCellId={setFixedCellId}
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
        tessellationMechanism={tessellationMechanism}
        onHandleDrag={updateBaseHandle}
      />
    </div>
  );
}
