"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BASE_ORIENTATION_DEG,
  DEFAULT_FOLD_PROGRESS,
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
  addPoint,
  addShape,
  getActiveShape,
  removePoint,
  removeShape,
  resetBaseState,
  setActiveShape,
  setShapeAxisConstraintMode,
  setShapeEnabled,
  updateHandleLocal,
} from "./rosette/domains/shape";
import { buildTessellationMechanism, buildTilingCells } from "./rosette/domains/tessellation";
import { rotatePoint, toRad } from "./rosette/math";
import {
  BaseState,
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
  const [baseState, setBaseState] = useState<BaseState>(resetBaseState);
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
  const activeShape = useMemo(() => getActiveShape(baseState), [baseState]);
  const enabledPolylines = useMemo(
    () => baseState.shapes.filter((shape) => shape.enabled !== false).map((shape) => shape.points),
    [baseState.shapes],
  );

  const rosetteCurvesLocal = useMemo(
    () => buildRosetteCurvesLocal(enabledPolylines, order, baseRotation, mirrorAdjacency),
    [enabledPolylines, order, baseRotation, mirrorAdjacency],
  );

  const transformedCurves = useMemo(
    () => transformCurvesToCenter(rosetteCurvesLocal, center),
    [rosetteCurvesLocal, center],
  );

  const activeBaseCurve = useMemo(() => {
    if (!activeShape) return [];
    return activeShape.points.map((point) => {
      const oriented = rotatePoint(point, baseRotation);
      return { x: center.x + oriented.x, y: center.y + oriented.y };
    });
  }, [activeShape, baseRotation, center]);

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
    if (editorLevel !== "shape" || !activeShape) return;
    setBaseState((current) =>
      updateHandleLocal(
        current,
        activeShape.id,
        handleIndex,
        globalPoint,
        center,
        baseRotation,
      ),
    );
  };

  const addHandle = () => {
    if (editorLevel !== "shape" || !activeShape) return;
    setBaseState((current) => addPoint(current, activeShape.id, { type: "append" }));
  };
  const removeHandle = () => {
    if (editorLevel !== "shape" || !activeShape) return;
    setBaseState((current) => removePoint(current, activeShape.id, "last"));
  };

  const insertHandleOnSegment = (shapeId: string, globalPoint: Point) => {
    if (editorLevel !== "shape") return;
    const centeredPoint = {
      x: globalPoint.x - center.x,
      y: globalPoint.y - center.y,
    };
    const localPoint = rotatePoint(centeredPoint, -baseRotation);
    setBaseState((current) =>
      addPoint(current, shapeId, { type: "insert-on-segment", point: localPoint, tolerance: 24 }),
    );
  };

  const resetShape = () => {
    setBaseState(resetBaseState());
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
        baseState={baseState}
        setActiveShape={(shapeId) => setBaseState((current) => setActiveShape(current, shapeId))}
        setShapeEnabled={(shapeId, enabled) =>
          setBaseState((current) => setShapeEnabled(current, shapeId, enabled))
        }
        setShapeAxisConstraint={(shapeId, enabled) =>
          setBaseState((current) =>
            setShapeAxisConstraintMode(
              current,
              shapeId,
              enabled
                ? "endpoints-on-axis"
                : "none",
            ),
          )
        }
        addShape={() => setBaseState((current) => addShape(current))}
        removeShape={(shapeId) => setBaseState((current) => removeShape(current, shapeId))}
        activeShapePointsLength={activeShape?.points.length ?? 0}
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
        baseRotation={baseRotation}
        editorLevel={editorLevel}
        transformedCurves={transformedCurves}
        rosetteCurvesLocal={rosetteCurvesLocal}
        baseShapes={baseState.shapes}
        activeShapeId={baseState.activeShapeId}
        activeBaseCurve={activeBaseCurve}
        tessellationMechanism={tessellationMechanism}
        onHandleDrag={updateBaseHandle}
        onInsertPointOnSegment={insertHandleOnSegment}
        onSetActiveShape={(shapeId) => setBaseState((current) => setActiveShape(current, shapeId))}
      />
    </div>
  );
}
