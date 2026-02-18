import { useEffect, useMemo, useRef, useState } from "react";
import type { KonvaEventObject } from "konva/lib/Node";
import { Circle, Group, Layer, Line, Stage } from "react-konva";
import { clampScale, zoomToPoint } from "../mathViewport";
import { flattenPoints, rotatePoint } from "../math";
import { EditorLevel, Point, Size, TessellationMechanism, Viewport } from "../types";

type RosetteCanvasProps = {
  size: Size;
  center: Point;
  order: number;
  lineThickness: number;
  editorLevel: EditorLevel;
  transformedCurves: Point[][];
  rosetteCurvesLocal: Point[][];
  activeBaseCurve: Point[];
  tessellationMechanism: TessellationMechanism;
  onHandleDrag: (handleIndex: number, point: Point) => void;
};

export function RosetteCanvas({
  size,
  center,
  order,
  lineThickness,
  editorLevel,
  transformedCurves,
  rosetteCurvesLocal,
  activeBaseCurve,
  tessellationMechanism,
  onHandleDrag,
}: RosetteCanvasProps) {
  const stageRef = useRef<import("konva/lib/Stage").Stage | null>(null);
  const [viewport, setViewport] = useState<Viewport>({
    scale: 1,
    offset: { x: 0, y: 0 },
  });
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const panStartRef = useRef<{ pointer: Point; offset: Point } | null>(null);

  const isShapeLevel = editorLevel === "shape";
  const isRosetteLevel = editorLevel === "rosette";
  const isTilingLevel = editorLevel === "tiling";
  const isPanReady = isSpaceDown && !isEditingHandle;

  const guideStroke = isRosetteLevel ? "#22d3ee" : isTilingLevel ? "#a855f7" : "#334155";
  const guideOpacity = isRosetteLevel ? 0.7 : isShapeLevel ? 0.3 : 0.22;
  const motifStroke = isTilingLevel ? "#c084fc" : "#67e8f9";
  const motifOpacity = isRosetteLevel ? 0.78 : isShapeLevel ? 0.28 : 0.42;
  const baseOpacity = isShapeLevel ? 1 : 0.4;

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

  const beginPan = (event: KonvaEventObject<MouseEvent>) => {
    if (!isPanReady) return;
    const stage = stageRef.current;
    if (!stage) return;

    if (event.target.hasName("base-handle")) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    event.evt.preventDefault();
    panStartRef.current = {
      pointer: { x: pointer.x, y: pointer.y },
      offset: viewport.offset,
    };
    setIsPanning(true);
  };

  const continuePan = () => {
    if (!isPanning || !panStartRef.current) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

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

  const onWheel = (event: KonvaEventObject<WheelEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    event.evt.preventDefault();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const zoomIntensity = 0.0015;
    const nextScale = clampScale(viewport.scale * Math.exp(-event.evt.deltaY * zoomIntensity));
    setViewport((current) => zoomToPoint(current, pointer, nextScale));
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
    <Stage
      ref={stageRef}
      width={size.width}
      height={size.height}
      onWheel={onWheel}
      onMouseDown={beginPan}
      onMouseMove={continuePan}
      onMouseUp={endPan}
      onMouseLeave={endPan}
      style={{ cursor: canvasCursor }}
    >
      <Layer>
        <Group
          x={viewport.offset.x}
          y={viewport.offset.y}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
        >
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
            tessellationMechanism.poses.map((pose, cellIndex) => {
              const cellOpacity = Math.max(0.24, 0.86 - pose.depth * 0.11);
              const nodeCenter = poseCenter(pose);

              return (
                <Group key={`tiling-cell-${pose.id}-${cellIndex}`}>
                  {rosetteCurvesLocal.map((curve, curveIndex) => (
                    <Line
                      key={`tiling-cell-${pose.id}-${curveIndex}`}
                      points={flattenPoints(
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
                      )}
                      stroke="#c084fc"
                      strokeWidth={Math.max(0.55, lineThickness - 0.25)}
                      lineCap="round"
                      lineJoin="round"
                      opacity={cellOpacity}
                    />
                  ))}

                  <Circle
                    x={nodeCenter.x}
                    y={nodeCenter.y}
                    radius={pose.isFixed ? 4.2 : pose.isRoot ? 3.8 : 2.6}
                    fill={pose.isFixed ? "#ef4444" : pose.isRoot ? "#22d3ee" : "#c084fc"}
                    opacity={pose.isFixed ? 0.95 : pose.isRoot ? 0.9 : 0.5}
                  />
                </Group>
              );
            })}

          {isTilingLevel &&
            tessellationMechanism.edges.map((edge, edgeIndex) => {
              const parent = tessellationMechanism.poses.find((pose) => pose.id === edge.parentId);
              const child = tessellationMechanism.poses.find((pose) => pose.id === edge.childId);
              if (!parent || !child) return null;
              const parentCenter = poseCenter(parent);
              const childCenter = poseCenter(child);

              return (
                <Line
                  key={`edge-${edge.parentId}-${edge.childId}-${edgeIndex}`}
                  points={[parentCenter.x, parentCenter.y, childCenter.x, childCenter.y]}
                  stroke="#34d399"
                  strokeWidth={Math.max(1, lineThickness - 0.3)}
                  dash={[5, 4]}
                  opacity={Math.max(0.35, 0.9 - edge.depth * 0.08)}
                />
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
                    name="base-handle"
                    x={handle.x}
                    y={handle.y}
                    radius={6}
                    fill="#f59e0b"
                    stroke="#111827"
                    strokeWidth={1.5}
                    draggable
                    onDragStart={(event) => {
                      event.cancelBubble = true;
                      setIsEditingHandle(true);
                    }}
                    onDragMove={(event) =>
                      onHandleDrag(handleIndex, {
                        x: event.target.x(),
                        y: event.target.y(),
                      })
                    }
                    onDragEnd={(event) => {
                      event.cancelBubble = true;
                      setIsEditingHandle(false);
                    }}
                  />
                ))}
            </>
          )}
        </Group>
      </Layer>
    </Stage>
  );
}
