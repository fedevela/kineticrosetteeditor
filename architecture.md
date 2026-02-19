# Architecture — Kinetic Rosette Editor (React + Vite + Konva)

This document explains the system technically so it can be reused as context for other LLMs.

---

## 1) High-level system view

The application is a **client-side interactive geometric editor** built with **React 19 + Vite + React Router** and rendered with **react-konva/Konva**.

Main architectural split:

- **Application shell/routing**: `src/main.tsx`, `src/App.tsx`
- **Orchestration layer**: `RosetteMechanism.tsx`
- **State layer**: `rosette/state/editorStore.tsx`
- **Domain logic (pure geometry functions)**: `src/components/rosette/domains/*`
- **Presentation layer**:
  - Control surface: `RosetteControlsPanel.tsx`
  - Canvas renderer: `RosetteCanvas.tsx`
  - Context badge: `EditingBadge.tsx`

Core behavior is event-driven:

1. user interaction (slider/toggle/drag)
2. state update through `editorStore` actions/reducer
3. memoized domain recomputation (`useMemo` + pure functions)
4. declarative canvas redraw via React + Konva

---

## 2) 3-level architecture (technical)

The system operates on three compositional levels controlled by `editorLevel: "shape" | "rosette" | "tiling"`.

## Level 1 — Shape (Seed geometry)

**Goal**: define and edit the base motif curve.

**Key state**:

- `sliceState.sprites[]` (multi-sprite local polylines)
- `sliceState.activeSpriteId`
- `sprite.axisConstraintMode`
- `baseOrientationDeg` (used to convert between global and local coordinates when dragging)

**Key domain functions** (`domains/sprite.ts`):

- `updateHandleLocal(...)`
- `addPoint(...)` / `removePoint(...)`
- `addSprite(...)` / `removeSprite(...)`
- `setSpriteAxisConstraintMode(...)`

**Important mechanics**:

- Handle dragging happens in canvas/global coordinates, then converted back to local coordinates.
- First and last points can be constrained to the symmetry axis (`x = 0`) to preserve bilateral structure.

**Output of level 1**:

- Validated local sprite polylines (`sliceState.sprites[].points`) used by Level 2 replication.

## Level 2 — Rosette (Cyclic replication)

**Goal**: generate the rosette by rotating (and optionally mirroring) the seed motif.

**Key state**:

- `order` (symmetry order, snapped to allowed set)
- `mirrorAdjacency`
- `lineThickness`
- `baseOrientationDeg` → `baseRotation` (radians)

**Key domain functions** (`domains/rosette.ts`):

- `buildRosetteCurvesFromSlice(enabledSpritePolylines, order, baseRotation, mirrorAdjacency)`
- `transformCurvesToCenter(curves, center)`

**Important mechanics**:

- Replication count = `order`.
- Each sector rotates by `2π/order`.
- If `mirrorAdjacency` is enabled, odd sectors reflect points (`x -> -x`) before rotation.

**Output of level 2**:

- `rosetteCurvesFromSlice` (local coordinates)
- `transformedCurves` (canvas-centered coordinates)

## Level 3 — Tiling/Tessellation (Cell composition)

**Goal**: place rosette cells on a lattice and propagate orientation/symmetry relations.

**Key state**:

- `tilingLattice: "hex" | "square"`
- `tilingRings`, `tilingSpacing`
- `tessellationSymmetry: "translation" | "reflection" | "glide"`
- `tessellationBranchOrder: "ring" | "spiral" | "axis-first"`
- `interCellRotation`, `foldProgress`
- `fixedCellId`

**Key domain functions** (`domains/tessellation.ts`):

- `buildTilingCells(tilingLattice, tilingRings, tilingSpacing)`
- `buildTessellationMechanism({ cells, order, baseOrientation, interCellRotation, symmetry, branchOrder, fixedCellId })`

**Important mechanics**:

- Lattice generation supports square and axial-hex systems.
- A root/fixed cell anchors propagation.
- Parent-child edges are built over sorted traversal order.
- Orientation and mirroring are propagated by symmetry rule:
  - translation: forward rotation accumulation
  - reflection: alternating reflected orientation
  - glide: alternating orientation + lateral glide offset

**Output of level 3**:

- `TessellationMechanism = { cells, edges, poses }`
- Used by renderer to draw replicated rosettes, centers, and connectivity edges.

---

## 3) React + Konva rendering architecture

## React side

- `src/main.tsx` bootstraps React with `BrowserRouter` and global styles.
- `src/App.tsx` defines routes (`/` and fallback redirect) and mounts `RosetteMechanism`.
- `RosetteMechanism` wraps the feature in `RosetteEditorProvider`, then composes controls, badge, and canvas.

## Konva side (`RosetteCanvas.tsx`)

Scene graph structure:

- `<Stage width height>`
- `<Layer>`
  - radial guide lines
  - rosette lines (shape/rosette modes)
  - tiled rosettes + cell markers (tiling mode)
  - tessellation edges (tiling mode)
  - editable base curve + draggable handles (shape mode)

Why Konva here:

- Efficient 2D immediate-style rendering with a React declarative API.
- Easy drag handling (`Circle draggable onDragMove`).
- Simple layered scene composition.

---

## 4) Data flow (end-to-end)

1. **Input**: control panel interaction or handle drag.
2. **State update**: actions from `editorStore` reducer (history-aware, undo/redo).
3. **Derived math**:
   - `baseRotation = toRad(baseOrientationDeg)`
   - rosette generation (`buildRosetteCurvesFromSlice`)
   - centering transform (`transformCurvesToCenter`)
   - tiling cells (`buildTilingCells`)
   - mechanism propagation (`buildTessellationMechanism`)
4. **Render**: `RosetteCanvas` maps derived arrays into Konva nodes.

Persistence and performance strategy:

- Project state is hydrated/saved from `localStorage` via `useEditorPersistence`.
- Heavy geometry calculations are isolated in pure functions and consumed with `useMemo`.
- Rendering is controlled by small state deltas and React reconciliation.

---

## 5) Source map (where each concern lives)

- `src/main.tsx` → app bootstrap
- `src/App.tsx` → route shell
- `src/components/RosetteMechanism.tsx` → composition root
- `src/components/rosette/state/editorStore.tsx` → reducer, actions, undo/redo history
- `src/components/rosette/components/RosetteControlsPanel.tsx` → UI controls per level
- `src/components/rosette/components/RosetteCanvas.tsx` → Konva renderer
- `src/components/rosette/components/EditingBadge.tsx` → active-level indicator
- `src/components/rosette/domains/sprite.ts` → level-1 geometry editing rules
- `src/components/rosette/domains/rosette.ts` → level-2 replication transforms
- `src/components/rosette/domains/tessellation.ts` → level-3 lattice + mechanism propagation
- `src/components/rosette/constants.ts` → defaults, ranges, level metadata
- `src/components/rosette/types.ts` → shared types and mechanism contracts
- `src/components/rosette/hooks/useDerivedGeometry.ts` → memoized derived pipeline
- `src/components/rosette/hooks/useEditorPersistence.ts` → local persistence lifecycle
- `src/components/rosette/math.ts` + `mathViewport.ts` → geometry and viewport utilities

---

## 6) LLM handoff summary (copy/paste)

Use this when briefing another model:

> This is a React + Vite client-side geometric editor with a 3-level architecture.  
> Level 1 (shape): edit one or more sprite polylines with optional endpoint axis constraints.  
> Level 2 (rosette): replicate the seed by rotational symmetry order `n` with optional mirrored adjacency.  
> Level 3 (tiling): place rosette cells on square/hex lattices and propagate orientation via translation/reflection/glide rules.  
> `editorStore.tsx` owns reducer/history state; `useDerivedGeometry.ts` computes memoized geometry; pure logic lives in `domains/*`; `RosetteCanvas.tsx` renders via react-konva.

Short glossary:

- **order**: number of rotational sectors in one rosette
- **mirror adjacency**: reflect every odd replicated sector
- **branch order**: traversal strategy for connecting tiling cells
- **fold progress**: interpolation factor for inter-cell rotational folding
- **fixed cell**: anchoring cell id used as propagation root
