# Architecture — Kinetic Rosette Editor (Next.js + Konva)

This document explains the system technically so it can be reused as context for other LLMs.

---

## 1) High-level system view

The application is a **client-side interactive geometric editor** built with **Next.js (App Router)** and rendered with **react-konva/Konva**.

Main architectural split:

- **Application shell**: Next.js page and layout (`src/app/*`)
- **Orchestration/state layer**: `RosetteMechanism.tsx`
- **Domain logic (pure geometry functions)**: `src/components/rosette/domains/*`
- **Presentation layer**:
  - Control surface: `RosetteControlsPanel.tsx`
  - Canvas renderer: `RosetteCanvas.tsx`
  - Context badge: `EditingBadge.tsx`

Core behavior is event-driven:

1. user interaction (slider/toggle/drag)
2. state update in `RosetteMechanism`
3. memoized domain recomputation (`useMemo` + pure functions)
4. declarative canvas redraw via React + Konva

---

## 2) 3-level architecture (technical)

The system operates on three compositional levels controlled by `editorLevel: "shape" | "rosette" | "tiling"`.

## Level 1 — Shape (Seed geometry)

**Goal**: define and edit the base motif curve.

**Key state**:

- `baseLinePoints: Point[]`
- `limitMovementToSymmetricalAxis: boolean`
- `baseOrientationDeg` (used to convert between global and local coordinates when dragging)

**Key domain functions** (`domains/shape.ts`):

- `constrainBaseLineToSymmetricalAxis(points)`
- `updateBaseHandleLocal(current, handleIndex, globalPoint, center, baseRotation, limitMovement...)`
- `addHandlePoint(current)`
- `removeHandlePoint(current)`

**Important mechanics**:

- Handle dragging happens in canvas/global coordinates, then converted back to local coordinates.
- First and last points can be constrained to the symmetry axis (`x = 0`) to preserve bilateral structure.

**Output of level 1**:

- A validated local seed polyline (`baseLinePoints`) used by Level 2 replication.

## Level 2 — Rosette (Cyclic replication)

**Goal**: generate the rosette by rotating (and optionally mirroring) the seed motif.

**Key state**:

- `order` (symmetry order, snapped to allowed set)
- `mirrorAdjacency`
- `lineThickness`
- `baseOrientationDeg` → `baseRotation` (radians)

**Key domain functions** (`domains/rosette.ts`):

- `buildRosetteCurvesLocal(baseLinePoints, order, baseRotation, mirrorAdjacency)`
- `transformCurvesToCenter(curves, center)`

**Important mechanics**:

- Replication count = `order`.
- Each sector rotates by `2π/order`.
- If `mirrorAdjacency` is enabled, odd sectors reflect points (`x -> -x`) before rotation.

**Output of level 2**:

- `rosetteCurvesLocal` (local coordinates)
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

## 3) Next.js + Konva rendering architecture

## Next.js side

- `src/app/page.tsx` renders the full-screen scene and mounts `RosetteMechanism`.
- `RosetteMechanism` is a client component (`"use client"`) because it uses React state, effects, and pointer interaction.

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
2. **State update**: setters in `RosetteMechanism`.
3. **Derived math**:
   - `baseRotation = toRad(baseOrientationDeg)`
   - rosette generation (`buildRosetteCurvesLocal`)
   - centering transform (`transformCurvesToCenter`)
   - tiling cells (`buildTilingCells`)
   - mechanism propagation (`buildTessellationMechanism`)
4. **Render**: `RosetteCanvas` maps derived arrays into Konva nodes.

Performance strategy:

- Heavy geometry calculations are isolated in pure functions and consumed with `useMemo`.
- Rendering is controlled by small state deltas and React reconciliation.

---

## 5) Source map (where each concern lives)

- `src/app/page.tsx` → app entry page
- `src/components/RosetteMechanism.tsx` → state orchestration + composition root
- `src/components/rosette/components/RosetteControlsPanel.tsx` → UI controls per level
- `src/components/rosette/components/RosetteCanvas.tsx` → Konva renderer
- `src/components/rosette/components/EditingBadge.tsx` → active-level indicator
- `src/components/rosette/domains/shape.ts` → level-1 geometry editing rules
- `src/components/rosette/domains/rosette.ts` → level-2 replication transforms
- `src/components/rosette/domains/tessellation.ts` → level-3 lattice + mechanism propagation
- `src/components/rosette/constants.ts` → defaults, ranges, level metadata
- `src/components/rosette/types.ts` → shared types and mechanism contracts
- `src/components/rosette/math.ts` → math utilities (rotation, flattening, unit conversions)

---

## 6) LLM handoff summary (copy/paste)

Use this when briefing another model:

> This is a Next.js client-side geometric editor with a 3-level architecture.  
> Level 1 (shape): edit a seed polyline with optional axis constraints.  
> Level 2 (rosette): replicate the seed by rotational symmetry order `n` with optional mirrored adjacency.  
> Level 3 (tiling): place rosette cells on square/hex lattices and propagate orientation via translation/reflection/glide rules.  
> `RosetteMechanism.tsx` owns state and memoized derived data; pure geometry logic lives in `domains/*`; `RosetteCanvas.tsx` renders via react-konva.

Short glossary:

- **order**: number of rotational sectors in one rosette
- **mirror adjacency**: reflect every odd replicated sector
- **branch order**: traversal strategy for connecting tiling cells
- **fold progress**: interpolation factor for inter-cell rotational folding
- **fixed cell**: anchoring cell id used as propagation root
