"use client";

import { useMemo } from "react";
import { buildRosetteCurvesFromSlice, transformCurvesToCenter } from "../domains/rosette";
import { applySpriteTransform, getActiveSprite, getSpriteRenderablePoints } from "../domains/sprite";
import { buildTessellationMechanism, buildTilingCells } from "../domains/tessellation";
import { rotatePoint, toRad } from "../math";
import { RosetteProjectState, Size, TessellationMechanism, TilingCell } from "../types";

const EMPTY_TESSELLATION = {
  cells: [] as TilingCell[],
  edges: [],
  poses: [],
} satisfies TessellationMechanism;

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
        .map((sprite) => applySpriteTransform(getSpriteRenderablePoints(sprite), sprite)),
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
    const spritePoints = applySpriteTransform(getSpriteRenderablePoints(activeSprite), activeSprite);
    return spritePoints.map((point) => {
      const oriented = rotatePoint(point, baseRotation);
      return { x: center.x + oriented.x, y: center.y + oriented.y };
    });
  }, [activeSprite, baseRotation, center]);

  const isTilingLevel = projectState.editorLevel === "tiling";

  const tilingCells = useMemo(() => {
    if (!isTilingLevel) return EMPTY_TESSELLATION.cells;
    return buildTilingCells(projectState.tilingLattice, projectState.tilingRings, projectState.tilingSpacing);
  }, [isTilingLevel, projectState.tilingLattice, projectState.tilingRings, projectState.tilingSpacing]);

  const tessellationMechanism = useMemo(() => {
    if (!isTilingLevel) return EMPTY_TESSELLATION;

    return buildTessellationMechanism({
      cells: tilingCells,
      order: projectState.order,
      baseOrientation: baseRotation,
      interCellRotation: toRad(projectState.interCellRotation) * projectState.foldProgress,
      symmetry: projectState.tessellationSymmetry,
      branchOrder: projectState.tessellationBranchOrder,
      fixedCellId: projectState.fixedCellId.trim() || undefined,
    });
  }, [
    isTilingLevel,
    tilingCells,
    projectState.order,
    baseRotation,
    projectState.interCellRotation,
    projectState.foldProgress,
    projectState.tessellationSymmetry,
    projectState.tessellationBranchOrder,
    projectState.fixedCellId,
  ]);

  return {
    center,
    baseRotation,
    rosetteCurvesFromSlice,
    transformedCurves,
    activeSpriteCurve,
    tessellationMechanism,
  };
};
