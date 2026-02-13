"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Layer, RegularPolygon, Stage } from "react-konva";

type Size = {
  width: number;
  height: number;
};

const MIN_RADIUS = 96;
const MAX_RADIUS = 220;
const DEFAULT_ROTATION = 180;
const MIN_ROTATION = 0;
const MAX_ROTATION = 360;
const ROTATION_STEP = 15;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const normalizeRotation = (value: number) => {
  const normalized = value % MAX_ROTATION;
  return normalized < 0 ? normalized + MAX_ROTATION : normalized;
};

export function RosetteMechanismKonva() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [rotation, setRotation] = useState(DEFAULT_ROTATION);

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

  const updateRotation = (value: number) => {
    const boundedValue = clamp(value, MIN_ROTATION, MAX_ROTATION);
    setRotation(normalizeRotation(boundedValue));
  };

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <div className="pointer-events-none absolute left-4 top-4 z-10 w-80 rounded-md border border-zinc-600/80 bg-zinc-900/85 p-3 text-zinc-100 shadow-lg backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
            Triangle Rotation
          </p>
          <p className="text-sm font-semibold tabular-nums">{rotation.toFixed(0)}°</p>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateRotation(rotation - ROTATION_STEP)}
            className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800"
            aria-label={`Rotate counterclockwise ${ROTATION_STEP} degrees`}
          >
            -{ROTATION_STEP}°
          </button>

          <input
            type="range"
            min={MIN_ROTATION}
            max={MAX_ROTATION}
            step={1}
            value={rotation}
            onChange={(event) => updateRotation(Number(event.target.value))}
            className="w-full accent-teal-400"
            aria-label="Triangle rotation"
          />

          <button
            type="button"
            onClick={() => updateRotation(rotation + ROTATION_STEP)}
            className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800"
            aria-label={`Rotate clockwise ${ROTATION_STEP} degrees`}
          >
            +{ROTATION_STEP}°
          </button>
        </div>

        <div className="pointer-events-auto mt-3 flex items-center justify-between gap-2">
          <label htmlFor="rotation-input" className="text-xs text-zinc-400">
            Fine angle
          </label>
          <input
            id="rotation-input"
            type="number"
            min={MIN_ROTATION}
            max={MAX_ROTATION}
            step={1}
            value={rotation}
            onChange={(event) => {
              const nextValue = Number(event.target.value);
              if (Number.isNaN(nextValue)) return;
              updateRotation(nextValue);
            }}
            className="w-20 rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-right text-sm tabular-nums"
          />
          <button
            type="button"
            onClick={() => setRotation(DEFAULT_ROTATION)}
            className="rounded border border-zinc-500 px-2 py-1 text-xs text-zinc-200 transition-colors hover:border-zinc-300 hover:bg-zinc-800"
          >
            Reset
          </button>
        </div>
      </div>

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
              rotation={rotation}
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}
