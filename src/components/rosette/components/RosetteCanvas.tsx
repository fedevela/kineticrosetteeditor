import { Circle, Group, Layer, Line, Stage } from "react-konva";
import { flattenPoints, rotatePoint, toRad } from "../math";
import { EditorLevel, Point, Size, TilingCell } from "../types";

type RosetteCanvasProps = {
  size: Size;
  center: Point;
  order: number;
  lineThickness: number;
  editorLevel: EditorLevel;
  transformedCurves: Point[][];
  rosetteCurvesLocal: Point[][];
  activeBaseCurve: Point[];
  tilingCells: TilingCell[];
  interCellRotation: number;
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
  tilingCells,
  interCellRotation,
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
  const centerColor = isShapeLevel ? "#f59e0b" : isRosetteLevel ? "#2dd4bf" : "#c084fc";

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
                    onHandleDrag(handleIndex, {
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
  );
}
