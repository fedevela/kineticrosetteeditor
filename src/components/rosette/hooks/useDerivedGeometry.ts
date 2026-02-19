"use client";

import { useMemo } from "react";
import { buildRosetteCurvesFromSlice, transformCurvesToCenter } from "../domains/rosette";
import { getActiveSprite } from "../domains/sprite";
import { buildTessellationMechanism, buildTilingCells } from "../domains/tessellation";
import { rotatePoint, toRad } from "../math";
import { RosetteProjectState, Size } from "../types";

export const useDerivedGeometry = (projectState: RosetteProjectState, size: Size) => {
  const center = useMemo(() => ({ x: size.width / 2, y: size.height / 2 }), [size]);
  const baseRotation = useMemo(() => toRad(projectState.baseOrientationDeg), [projectState.baseOrientationDeg]);

  const activeSprite = useMemo(
    () => getActiveSprite(projectState.sliceState),
    [projectState.sliceState],
  );

  const enabledSpritePolylines = useMemo(
    () =>
      projectState.sliceState.sprites
        .filter((sprite) => sprite.enabled !== false)
        .map((sprite) => sprite.points),
    [projectState.sliceState.sprites],
  );

  const rosetteCurvesFromSlice = useMemo(
    () =>
      buildRosetteCurvesFromSlice(
        enabledSpritePolylines,
        projectState.order,
        baseRotation,
        projectState.mirrorAdjacency,
      ),
    [enabledSpritePolylines, projectState.order, baseRotation, projectState.mirrorAdjacency],
  );

  const transformedCurves = useMemo(
    () => transformCurvesToCenter(rosetteCurvesFromSlice, center),
    [rosetteCurvesFromSlice, center],
  );

  const activeSpriteCurve = useMemo(() => {
    if (!activeSprite) return [];
    return activeSprite.points.map((point) => {
      const oriented = rotatePoint(point, baseRotation);
      return { x: center.x + oriented.x, y: center.y + oriented.y };
    });
  }, [activeSprite, baseRotation, center]);

  const tilingCells = useMemo(
    () => buildTilingCells(projectState.tilingLattice, projectState.tilingRings, projectState.tilingSpacing),
    [projectState.tilingLattice, projectState.tilingRings, projectState.tilingSpacing],
  );

  const tessellationMechanism = useMemo(
    () =>
      buildTessellationMechanism({
        cells: tilingCells,
        order: projectState.order,
        baseOrientation: baseRotation,
        interCellRotation: toRad(projectState.interCellRotation) * projectState.foldProgress,
        symmetry: projectState.tessellationSymmetry,
        branchOrder: projectState.tessellationBranchOrder,
        fixedCellId: projectState.fixedCellId.trim() || undefined,
      }),
    [
      tilingCells,
      projectState.order,
      baseRotation,
      projectState.interCellRotation,
      projectState.foldProgress,
      projectState.tessellationSymmetry,
      projectState.tessellationBranchOrder,
      projectState.fixedCellId,
    ],
  );

  return {
    center,
    baseRotation,
    rosetteCurvesFromSlice,
    transformedCurves,
    activeSpriteCurve,
    tessellationMechanism,
  };
};
