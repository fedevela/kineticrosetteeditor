import { Circle, Group, Layer, Line, Stage } from "react-konva";
import { flattenPoints, rotatePoint } from "../math";
import { EditorLevel, Point, Size, TessellationMechanism } from "../types";

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
  const isShapeLevel = editorLevel === "shape";
  const isRosetteLevel = editorLevel === "rosette";
  const isTilingLevel = editorLevel === "tiling";

  const guideStroke = isRosetteLevel ? "#22d3ee" : isTilingLevel ? "#a855f7" : "#334155";
  const guideOpacity = isRosetteLevel ? 0.7 : isShapeLevel ? 0.3 : 0.22;
  const motifStroke = isTilingLevel ? "#c084fc" : "#67e8f9";
  const motifOpacity = isRosetteLevel ? 0.78 : isShapeLevel ? 0.28 : 0.42;
  const baseOpacity = isShapeLevel ? 1 : 0.4;
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
                  x={handle.x}
                  y={handle.y}
                  radius={6}
                  fill="#f59e0b"
                  stroke="#111827"
                  strokeWidth={1.5}
                  draggable
                  onDragMove={(event) =>
                    onHandleDrag(handleIndex, {
                      x: event.target.x(),
                      y: event.target.y(),
                    })
                  }
                />
              ))}
          </>
        )}
      </Layer>
    </Stage>
  );
}
