"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_BASE_ORIENTATION_DEG,
  MIN_BASE_ORIENTATION_DEG,
  LEVEL_META,
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
  setActiveShape,
  setShapeAxisConstraintMode,
  setShapeEnabled,
  updateHandleLocal,
} from "./rosette/domains/shape";
import { buildTessellationMechanism, buildTilingCells } from "./rosette/domains/tessellation";
import { rotatePoint, toRad } from "./rosette/math";
import { createDefaultProjectState } from "./rosette/projectState";
import { Point, RosetteProjectState, Size } from "./rosette/types";

type HistoryState = {
  past: RosetteProjectState[];
  present: RosetteProjectState;
  future: RosetteProjectState[];
};

const createInitialHistoryState = (): HistoryState => ({
  past: [],
  present: createDefaultProjectState(),
  future: [],
});

export function RosetteMechanism() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [history, setHistory] = useState<HistoryState>(createInitialHistoryState);
  const [hasHydrated, setHasHydrated] = useState(false);
  const isHydratingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const projectState = history.present;
  const {
    editorLevel,
    order,
    lineThickness,
    baseOrientationDeg,
    mirrorAdjacency,
    baseState,
    tilingLattice,
    tilingSpacing,
    tilingRings,
    interCellRotation,
    tessellationSymmetry,
    tessellationBranchOrder,
    foldProgress,
    fixedCellId,
  } = projectState;

  const commit = (updater: (current: RosetteProjectState) => RosetteProjectState) => {
    setHistory((current) => {
      const nextPresent = updater(current.present);
      if (JSON.stringify(nextPresent) === JSON.stringify(current.present)) return current;
      return {
        past: [...current.past, current.present],
        present: nextPresent,
        future: [],
      };
    });
  };

  const undo = () => {
    setHistory((current) => {
      if (current.past.length === 0) return current;
      const previous = current.past[current.past.length - 1];
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  };

  const redo = () => {
    setHistory((current) => {
      if (current.future.length === 0) return current;
      const [next, ...restFuture] = current.future;
      return {
        past: [...current.past, current.present],
        present: next,
        future: restFuture,
      };
    });
  };

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

  useEffect(() => {
    let cancelled = false;
    isHydratingRef.current = true;
    (async () => {
      try {
        const response = await fetch("/api/project", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { state?: RosetteProjectState };
        if (cancelled || !data.state) return;
        setHistory({ past: [], present: data.state, future: [] });
      } finally {
        if (!cancelled) {
          isHydratingRef.current = false;
          setHasHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated || isHydratingRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      void fetch("/api/project", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: history.present }),
      });
    }, 250);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [hasHydrated, history.present]);

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
    commit((current) => ({
      ...current,
      baseState: updateHandleLocal(
        current.baseState,
        activeShape.id,
        handleIndex,
        globalPoint,
        center,
        baseRotation,
      ),
    }));
  };

  const addHandle = () => {
    if (editorLevel !== "shape" || !activeShape) return;
    commit((current) => ({
      ...current,
      baseState: addPoint(current.baseState, activeShape.id, { type: "append" }),
    }));
  };

  const removeHandle = () => {
    if (editorLevel !== "shape" || !activeShape) return;
    commit((current) => ({
      ...current,
      baseState: removePoint(current.baseState, activeShape.id, "last"),
    }));
  };

  const insertHandleOnSegment = (shapeId: string, globalPoint: Point) => {
    if (editorLevel !== "shape") return;
    const centeredPoint = {
      x: globalPoint.x - center.x,
      y: globalPoint.y - center.y,
    };
    const localPoint = rotatePoint(centeredPoint, -baseRotation);
    commit((current) => ({
      ...current,
      baseState: addPoint(current.baseState, shapeId, {
        type: "insert-on-segment",
        point: localPoint,
        tolerance: 24,
      }),
    }));
  };

  const activeMeta = LEVEL_META[editorLevel];

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <RosetteControlsPanel
        editorLevel={editorLevel}
        setEditorLevel={(value) => commit((current) => ({ ...current, editorLevel: value }))}
        order={order}
        setOrder={(value) => commit((current) => ({ ...current, order: value }))}
        lineThickness={lineThickness}
        setLineThickness={(value) => commit((current) => ({ ...current, lineThickness: value }))}
        baseOrientationDeg={baseOrientationDeg}
        setBaseOrientationDeg={(value) =>
          commit((current) => ({
            ...current,
            baseOrientationDeg: Math.min(MAX_BASE_ORIENTATION_DEG, Math.max(MIN_BASE_ORIENTATION_DEG, value)),
          }))
        }
        mirrorAdjacency={mirrorAdjacency}
        setMirrorAdjacency={(value) => commit((current) => ({ ...current, mirrorAdjacency: value }))}
        baseState={baseState}
        setActiveShape={(shapeId) =>
          commit((current) => ({ ...current, baseState: setActiveShape(current.baseState, shapeId) }))
        }
        setShapeEnabled={(shapeId, enabled) =>
          commit((current) => ({
            ...current,
            baseState: setShapeEnabled(current.baseState, shapeId, enabled),
          }))
        }
        setShapeAxisConstraint={(shapeId, enabled) =>
          commit((current) => ({
            ...current,
            baseState: setShapeAxisConstraintMode(
              current.baseState,
              shapeId,
              enabled ? "endpoints-on-axis" : "none",
            ),
          }))
        }
        addShape={() => commit((current) => ({ ...current, baseState: addShape(current.baseState) }))}
        removeShape={(shapeId) =>
          commit((current) => ({ ...current, baseState: removeShape(current.baseState, shapeId) }))
        }
        activeShapePointsLength={activeShape?.points.length ?? 0}
        addHandle={addHandle}
        removeHandle={removeHandle}
        tilingLattice={tilingLattice}
        setTilingLattice={(value) => commit((current) => ({ ...current, tilingLattice: value }))}
        tessellationSymmetry={tessellationSymmetry}
        setTessellationSymmetry={(value) =>
          commit((current) => ({ ...current, tessellationSymmetry: value }))
        }
        tessellationBranchOrder={tessellationBranchOrder}
        setTessellationBranchOrder={(value) =>
          commit((current) => ({ ...current, tessellationBranchOrder: value }))
        }
        tilingRings={tilingRings}
        setTilingRings={(value) => commit((current) => ({ ...current, tilingRings: value }))}
        tilingSpacing={tilingSpacing}
        setTilingSpacing={(value) => commit((current) => ({ ...current, tilingSpacing: value }))}
        interCellRotation={interCellRotation}
        setInterCellRotation={(value) => commit((current) => ({ ...current, interCellRotation: value }))}
        foldProgress={foldProgress}
        setFoldProgress={(value) => commit((current) => ({ ...current, foldProgress: value }))}
        fixedCellId={fixedCellId}
        setFixedCellId={(value) => commit((current) => ({ ...current, fixedCellId: value }))}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        undo={undo}
        redo={redo}
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
        onSetActiveShape={(shapeId) =>
          commit((current) => ({ ...current, baseState: setActiveShape(current.baseState, shapeId) }))
        }
      />
    </div>
  );
}
