import { Application, extend } from "@pixi/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Container, Graphics } from "pixi.js";
import { clampScale, screenToWorld, zoomToPoint } from "../mathViewport";
import { flattenPoints, rotatePoint } from "../math";
import { Point, Size, TessellationMechanism, Viewport } from "../types";
import { useEditorActions, useEditorState } from "../state/editorStore";
import { useDerivedGeometry } from "../hooks/useDerivedGeometry";

extend({ Container, Graphics });

const HEX = {
  cyan: 0x22d3ee,
  violet: 0xa855f7,
  slate: 0x334155,
  motifCyan: 0x67e8f9,
  motifViolet: 0xc084fc,
  amber: 0xf59e0b,
  gray: 0x94a3b8,
  edgeGreen: 0x34d399,
  fixedRed: 0xef4444,
  handleStroke: 0x111827,
};

const drawPolyline = (
  graphics: Graphics,
  points: number[],
  stroke: { width: number; color: number; alpha: number; cap?: "round"; join?: "round" },
) => {
  if (points.length < 4) return;
  graphics.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) {
    graphics.lineTo(points[i], points[i + 1]);
  }
  graphics.stroke(stroke);
};

type RosetteCanvasProps = {
  size: Size;
};

export function RosetteCanvas({ size }: RosetteCanvasProps) {
  const state = useEditorState();
  const actions = useEditorActions();
  const {
    center,
    baseRotation,
    rosetteCurvesFromSlice,
    transformedCurves,
    activeSpriteCurve,
    tessellationMechanism,
  } = useDerivedGeometry(state, size);

  const { order, lineThickness, editorLevel, sliceState } = state;
  const sprites = sliceState.sprites;
  const activeSpriteId = sliceState.activeSpriteId;

  const [viewport, setViewport] = useState<Viewport>({
    scale: 1,
    offset: { x: 0, y: 0 },
  });
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const panStartRef = useRef<{ pointer: Point; offset: Point } | null>(null);
  const handleDragRef = useRef<number | null>(null);

  const isShapeLevel = editorLevel === "shape";
  const isRosetteLevel = editorLevel === "rosette";
  const isTilingLevel = editorLevel === "tiling";
  const isPanReady = isSpaceDown && !isEditingHandle;

  const guideStroke = isRosetteLevel ? HEX.cyan : isTilingLevel ? HEX.violet : HEX.slate;
  const guideOpacity = isRosetteLevel ? 0.7 : isShapeLevel ? 0.3 : 0.22;
  const motifStroke = isTilingLevel ? HEX.motifViolet : HEX.motifCyan;
  const motifOpacity = isRosetteLevel ? 0.78 : isShapeLevel ? 0.28 : 0.42;
  const poseById = useMemo(
    () => new Map(tessellationMechanism.poses.map((pose) => [pose.id, pose])),
    [tessellationMechanism.poses],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (
        target?.isContentEditable ||
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT"
      ) {
        return;
      }

      event.preventDefault();
      setIsSpaceDown(true);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      setIsSpaceDown(false);
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const canvasCursor = useMemo(() => {
    if (isEditingHandle) return "move";
    if (isPanning) return "grabbing";
    if (isPanReady) return "grab";
    return "crosshair";
  }, [isEditingHandle, isPanning, isPanReady]);

  const beginPan = (pointer: Point) => {
    if (!isPanReady) return;
    panStartRef.current = {
      pointer,
      offset: viewport.offset,
    };
    setIsPanning(true);
  };

  const continuePan = (pointer: Point) => {
    if (!isPanning || !panStartRef.current) return;

    const { pointer: startPointer, offset: startOffset } = panStartRef.current;
    setViewport((current) => ({
      ...current,
      offset: {
        x: startOffset.x + (pointer.x - startPointer.x),
        y: startOffset.y + (pointer.y - startPointer.y),
      },
    }));
  };

  const endPan = () => {
    setIsPanning(false);
    panStartRef.current = null;
  };

  const endHandleDrag = (shouldSnapshot = true) => {
    if (handleDragRef.current == null) return;
    handleDragRef.current = null;
    setIsEditingHandle(false);
    if (shouldSnapshot) actions.snapshot();
  };

  const poseCenter = (pose: TessellationMechanism["poses"][number]) => {
    const glideX = Math.cos(pose.foldedAxis + Math.PI / 2) * pose.glideOffset;
    const glideY = Math.sin(pose.foldedAxis + Math.PI / 2) * pose.glideOffset;

    return {
      x: center.x + pose.x + glideX,
      y: center.y + pose.y + glideY,
    };
  };

  if (size.width <= 0 || size.height <= 0) return null;

  return (
    <div
      style={{ cursor: canvasCursor, width: size.width, height: size.height }}
      onWheel={(event) => {
        event.preventDefault();
        const bounds = event.currentTarget.getBoundingClientRect();
        const pointer = {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        };
        const zoomIntensity = 0.0015;
        const nextScale = clampScale(viewport.scale * Math.exp(-event.deltaY * zoomIntensity));
        setViewport((current) => zoomToPoint(current, pointer, nextScale));
      }}
    >
      <Application
        width={size.width}
        height={size.height}
        preference="canvas"
        antialias
        resolution={window.devicePixelRatio || 1}
        autoDensity
        backgroundAlpha={0}
      >
        <pixiContainer
          eventMode="static"
          onPointerDown={(event) => {
            const pointer = { x: event.global.x, y: event.global.y };
            beginPan(pointer);
          }}
          onPointerMove={(event) => {
            const pointer = { x: event.global.x, y: event.global.y };

            if (handleDragRef.current != null) {
              setIsEditingHandle(true);
              const worldPoint = screenToWorld(pointer, viewport);
              actions.updateSpriteHandle(handleDragRef.current, worldPoint, center, baseRotation);
              return;
            }

            continuePan(pointer);
          }}
          onPointerUp={() => {
            if (handleDragRef.current != null) {
              endHandleDrag(true);
              return;
            }

            endPan();
          }}
          onPointerUpOutside={() => {
            endHandleDrag(true);
            endPan();
          }}
          onPointerLeave={() => {
            // Fast drags can leave the interaction area before pointerup,
            // which can leave handle drag state "stuck".
            endHandleDrag(true);
            endPan();
          }}
        >
          <pixiContainer
            x={viewport.offset.x}
            y={viewport.offset.y}
            scale={{ x: viewport.scale, y: viewport.scale }}
            eventMode="none"
          >
          <pixiGraphics
            key="guides-batch"
            draw={(graphics) => {
              graphics.clear();
              for (let index = 0; index < order; index += 1) {
                const angle = (index * 2 * Math.PI) / order;
                const guideEnd = {
                  x: center.x + Math.cos(angle) * Math.min(size.width, size.height) * 0.44,
                  y: center.y + Math.sin(angle) * Math.min(size.width, size.height) * 0.44,
                };
                graphics.moveTo(center.x, center.y).lineTo(guideEnd.x, guideEnd.y);
              }
              graphics.stroke({
                width: 1,
                color: guideStroke,
                alpha: guideOpacity,
                cap: "round",
                join: "round",
              });
            }}
          />

          {!isTilingLevel && (
            <pixiGraphics
              key="rosette-curves-batch"
              draw={(graphics) => {
                graphics.clear();
                transformedCurves.forEach((curve) => {
                  drawPolyline(graphics, flattenPoints(curve), {
                    width: lineThickness,
                    color: motifStroke,
                    alpha: motifOpacity,
                    cap: "round",
                    join: "round",
                  });
                });
              }}
            />
          )}

          {isTilingLevel && (
            <>
              <pixiGraphics
                key="tiling-motifs-batch"
                draw={(graphics) => {
                  graphics.clear();
                  tessellationMechanism.poses.forEach((pose) => {
                    const cellOpacity = Math.max(0.24, 0.86 - pose.depth * 0.11);
                    const nodeCenter = poseCenter(pose);
                    rosetteCurvesFromSlice.forEach((curve) => {
                      const points = flattenPoints(
                        curve.map((point) => {
                          const mirroredPoint = pose.mirrored ? { x: -point.x, y: point.y } : point;
                          const orientedPoint =
                            pose.orientation === 0
                              ? mirroredPoint
                              : rotatePoint(mirroredPoint, pose.orientation);

                          return {
                            x: nodeCenter.x + orientedPoint.x,
                            y: nodeCenter.y + orientedPoint.y,
                          };
                        }),
                      );
                      drawPolyline(graphics, points, {
                        width: Math.max(0.55, lineThickness - 0.25),
                        color: HEX.motifViolet,
                        alpha: cellOpacity,
                        cap: "round",
                        join: "round",
                      });
                    });
                  });
                }}
              />

              <pixiGraphics
                key="tiling-centers-batch"
                draw={(graphics) => {
                  graphics.clear();
                  tessellationMechanism.poses.forEach((pose) => {
                    const nodeCenter = poseCenter(pose);
                    graphics
                      .circle(nodeCenter.x, nodeCenter.y, pose.isFixed ? 4.2 : pose.isRoot ? 3.8 : 2.6)
                      .fill({
                        color: pose.isFixed ? HEX.fixedRed : pose.isRoot ? HEX.cyan : HEX.motifViolet,
                        alpha: pose.isFixed ? 0.95 : pose.isRoot ? 0.9 : 0.5,
                      });
                  });
                }}
              />
            </>
          )}

          {isTilingLevel && (
            <pixiGraphics
              key="tiling-edges-batch"
              draw={(graphics) => {
                graphics.clear();
                tessellationMechanism.edges.forEach((edge) => {
                  const parent = poseById.get(edge.parentId);
                  const child = poseById.get(edge.childId);
                  if (!parent || !child) return;
                  const parentCenter = poseCenter(parent);
                  const childCenter = poseCenter(child);
                  graphics.moveTo(parentCenter.x, parentCenter.y).lineTo(childCenter.x, childCenter.y);
                  graphics.stroke({
                    width: Math.max(1, lineThickness - 0.3),
                    color: HEX.edgeGreen,
                    alpha: Math.max(0.35, 0.9 - edge.depth * 0.08),
                  });
                });
              }}
            />
          )}
          </pixiContainer>

          <pixiContainer
            x={viewport.offset.x}
            y={viewport.offset.y}
            scale={{ x: viewport.scale, y: viewport.scale }}
            eventMode="passive"
          >
          {isShapeLevel &&
            sprites.map((sprite) => {
              if (sprite.points.length <= 1) return null;
              const color = sprite.id === activeSpriteId ? HEX.amber : HEX.gray;
              const oriented = sprite.points.map((point) => {
                const orientedPoint = rotatePoint(point, baseRotation);
                return { x: center.x + orientedPoint.x, y: center.y + orientedPoint.y };
              });
              return (
                <pixiGraphics
                  key={sprite.id}
                  eventMode="static"
                  cursor="pointer"
                  draw={(graphics) => {
                    const points = flattenPoints(oriented);
                    if (points.length < 4) {
                      graphics.clear();
                      return;
                    }
                    graphics.clear().moveTo(points[0], points[1]);
                    for (let i = 2; i < points.length; i += 2) {
                      graphics.lineTo(points[i], points[i + 1]);
                    }
                    graphics.stroke({
                      width: sprite.id === activeSpriteId ? lineThickness + 1.2 : lineThickness,
                      color,
                      alpha: sprite.id === activeSpriteId ? 0.95 : 0.45,
                      cap: "round",
                      join: "round",
                    });
                  }}
                  onPointerTap={(event) => {
                    event.stopPropagation();
                    actions.setActiveSprite(sprite.id);
                    const pointer = { x: event.global.x, y: event.global.y };
                    const worldPoint = screenToWorld(pointer, viewport);
                    actions.insertHandleOnSegment(sprite.id, worldPoint, center, baseRotation);
                  }}
                />
              );
            })}

          {activeSpriteCurve.length > 1 &&
            isShapeLevel &&
            activeSpriteCurve.map((handle, handleIndex) => (
              <pixiGraphics
                key={`base-handle-${handleIndex}`}
                eventMode="static"
                cursor="move"
                draw={(graphics) => {
                  graphics
                    .clear()
                    .circle(handle.x, handle.y, 6)
                    .fill({ color: HEX.amber })
                    .stroke({ width: 1.5, color: HEX.handleStroke });
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  handleDragRef.current = handleIndex;
                  setIsEditingHandle(true);
                }}
                onPointerUp={(event) => {
                  event.stopPropagation();
                  endHandleDrag(true);
                }}
              />
            ))}
          </pixiContainer>
        </pixiContainer>
      </Application>
    </div>
  );
}
