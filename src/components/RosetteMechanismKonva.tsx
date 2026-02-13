"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Layer, RegularPolygon, Stage } from "react-konva";

type Size = {
  width: number;
  height: number;
};

const MIN_RADIUS = 96;
const MAX_RADIUS = 220;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function RosetteMechanismKonva() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const radius = useMemo(
    () => clamp(Math.min(size.width, size.height) * 0.2, MIN_RADIUS, MAX_RADIUS),
    [size.height, size.width],
  );

  return (
    <div ref={containerRef} className="h-full w-full">
      {size.width > 0 && size.height > 0 && (
        <Stage width={size.width} height={size.height}>
          <Layer>
            <RegularPolygon
              x={size.width / 2}
              y={size.height / 2}
              sides={3}
              radius={radius}
              fill="#4ecdc4"
              stroke="#ffffff"
              strokeWidth={4}
              rotation={180}
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
