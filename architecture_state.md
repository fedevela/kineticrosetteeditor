# Architecture State — Persistence Model and Data Shape

This document describes how editor state is represented, persisted, and restored.

---

## 1) What is persisted

The app persists only the **present project snapshot** (`RosetteProjectState`) in browser `localStorage`.

- Storage key: `rosette-project-state`
- Persistence mechanism: `src/components/rosette/hooks/useEditorPersistence.ts`
- Serialization format: `JSON.stringify(state)`

History stacks (`past` / `future`) are **not** persisted. On hydration, history is reset to:

- `past: []`
- `present: <persisted RosetteProjectState>`
- `future: []`

---

## 2) Persisted state shape (`RosetteProjectState`)

Defined in `src/components/rosette/types.ts`.

```ts
type RosetteProjectState = {
  editorLevel: "shape" | "rosette" | "tiling";
  order: number;
  lineThickness: number;
  baseOrientationDeg: number;
  mirrorAdjacency: boolean;
  sliceState: {
    activeSpriteId: string;
    sprites: Array<{
      id: string;
      type: "polyline";
      points: Array<{ x: number; y: number }>;
      isClosed?: boolean;
      enabled?: boolean;
      style?: {
        strokeWidth?: number;
        dash?: number[];
        opacity?: number;
      };
      constraints?: {
        endpointOnSymmetryAxis?: boolean;
        mirrorPairs?: Array<[number, number]>;
        snapToAxisThresholdPx?: number;
      };
    }>;
  };
  tilingLattice: "hex" | "square";
  tilingSpacing: number;
  tilingRings: number;
  interCellRotation: number;
  tessellationSymmetry: "translation" | "reflection" | "glide";
  tessellationBranchOrder: "ring" | "spiral" | "axis-first";
  foldProgress: number;
  fixedCellId: string;
};
```

---

## 3) Default state values

Defaults are created by `createDefaultProjectState()` in `src/components/rosette/projectState.ts`.

Current defaults include:

- `editorLevel: "shape"`
- `mirrorAdjacency: true`
- `tilingLattice: "hex"`
- `interCellRotation: 0`
- `fixedCellId: "0,0"`
- plus numeric defaults imported from `constants.ts` (`order`, `lineThickness`, `tilingSpacing`, `tilingRings`, `foldProgress`, etc.)

If no persisted data is found (or hydration fails), these defaults remain active.

---

## 4) Hydration and save lifecycle

Implemented in `useEditorPersistence`:

1. On mount, read `localStorage.getItem("rosette-project-state")`.
2. If found, parse JSON and call `setHistory({ past: [], present: persistedState, future: [] })`.
3. Mark hydration complete.
4. On subsequent state changes, debounce writes by `250ms`.
5. Save with `localStorage.setItem(STORAGE_KEY, JSON.stringify(state))`.

Guardrails:

- Read/write failures are caught and ignored.
- During hydration, writes are temporarily blocked (`isHydratingRef`) to avoid overwrite races.

---

## 5) Relationship with reducer history

`editorStore` internally uses:

```ts
type HistoryState = {
  past: RosetteProjectState[];
  present: RosetteProjectState;
  future: RosetteProjectState[];
};
```

Persistence only stores `present`, not full history. This keeps payload small and avoids persisting long undo chains.

---

## 6) Example persisted JSON

```json
{
  "editorLevel": "shape",
  "order": 8,
  "lineThickness": 1.6,
  "baseOrientationDeg": 0,
  "mirrorAdjacency": true,
  "sliceState": {
    "activeSpriteId": "sprite-1",
    "sprites": [
      {
        "id": "sprite-1",
        "type": "polyline",
        "points": [{ "x": 0, "y": -120 }, { "x": 40, "y": -60 }, { "x": 0, "y": 0 }],
        "enabled": true,
        "constraints": { "endpointOnSymmetryAxis": true }
      }
    ]
  },
  "tilingLattice": "hex",
  "tilingSpacing": 140,
  "tilingRings": 2,
  "interCellRotation": 10,
  "tessellationSymmetry": "translation",
  "tessellationBranchOrder": "ring",
  "foldProgress": 1,
  "fixedCellId": "0,0"
}
```
