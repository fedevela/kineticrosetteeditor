# Architecture UI — Domains and React Display Pipeline

This document describes how domain logic is organized and how it is displayed in React for the Kinetic Rosette editor.

---

## 1) Purpose and scope

The UI is built around **three editing domains** that map directly to geometry behavior and rendering:

- **Shape domain**: define/edit motif sprites (polylines)
- **Rosette domain**: replicate sprite curves by rotational symmetry
- **Tiling domain**: distribute rosette motifs across lattice cells with propagation rules

The architecture separates:

- **Pure domain logic** (`src/components/rosette/domains/*`)
- **State orchestration and composition** (`src/components/RosetteMechanism.tsx`)
- **UI controls + rendering** (`RosetteControlsPanel`, `RosetteCanvas`, `EditingBadge`)

---

## 2) Domain model

### 2.1 Core project state (`RosetteProjectState`)

Defined in `src/components/rosette/types.ts`, initialized in `createDefaultProjectState`:

- Editing/view context:
  - `editorLevel: "shape" | "rosette" | "tiling"`
- Rosette params:
  - `order`, `lineThickness`, `baseOrientationDeg`, `mirrorAdjacency`
- Slice/Sprite params:
  - `sliceState` (`activeSpriteId`, `sprites[]`)
- Tiling/tessellation params:
  - `tilingLattice`, `tilingSpacing`, `tilingRings`
  - `interCellRotation`, `tessellationSymmetry`, `tessellationBranchOrder`
  - `foldProgress`, `fixedCellId`

`RosetteMechanism` stores this state with undo/redo history (`past/present/future`) and persistence through `/api/project`.

### 2.2 Shape domain (sprite slice authoring)

File: `src/components/rosette/domains/sprite.ts`

Responsibilities:

- Create/reset sprites (`createDefaultSprite`, `resetSliceState`)
- Select active sprite (`setActiveSprite`, `getActiveSprite`)
- Edit points (`updateHandleLocal`, `addPoint`, `removePoint`)
- Manage per-sprite options (`setSpriteEnabled`, axis constraint mode)
- Enforce geometric constraints:
  - endpoint symmetry-axis lock
  - axis snap threshold

Coordinate behavior:

- Handle drags arrive in **global canvas coordinates**.
- Domain conversion transforms to **local motif coordinates** by subtracting center and inverse-rotating by `baseRotation`.

### 2.3 Rosette domain (rotational replication)

File: `src/components/rosette/domains/rosette.ts`

Responsibilities:

- Replicate each sprite polyline into `order` sectors
- Optionally mirror odd sectors (`mirrorAdjacency`)
- Apply `baseRotation` and sector angle increment (`2π/order`)
- Convert local curves to centered canvas coordinates (`transformCurvesToCenter`)

Output contract:

- `rosetteCurvesFromSlice: Point[][]` (local/origin-based)
- `transformedCurves: Point[][]` (centered for direct drawing)

### 2.4 Tiling domain (lattice + mechanism propagation)

File: `src/components/rosette/domains/tessellation.ts`

Responsibilities:

- Generate lattice cells (`buildTilingCells`) for:
  - `"square"` grid
  - axial `"hex"` layout
- Build parent-child mechanism (`buildTessellationMechanism`):
  - choose root/fixed cell
  - sort traversal by branch order (`ring`, `spiral`, `axis-first`)
  - choose parent, infer edge petals
  - propagate orientation/mirroring/glide by symmetry mode

Output contract:

- `TessellationMechanism`:
  - `cells[]`
  - `edges[]`
  - `poses[]` (orientation, mirrored, depth, glideOffset, root/fixed flags)

---

## 3) React architecture and responsibilities

### 3.1 Composition root: `RosetteMechanism`

`RosetteMechanism` is the stateful orchestrator (`"use client"`) that:

- Owns full project state + history (undo/redo)
- Hydrates/saves project state via `/api/project`
- Tracks responsive viewport container size
- Computes derived geometry with `useMemo`
- Passes callbacks to controls/canvas

Main derived pipeline in this component:

1. `baseRotation = toRad(baseOrientationDeg)`
2. `activeSprite` and enabled sprite polylines
3. `rosetteCurvesFromSlice = buildRosetteCurvesFromSlice(...)`
4. `transformedCurves = transformCurvesToCenter(...)`
5. `tilingCells = buildTilingCells(...)`
6. `tessellationMechanism = buildTessellationMechanism(...)`

### 3.2 Controls UI: `RosetteControlsPanel`

`RosetteControlsPanel` is a presentational control surface. It receives values + callbacks and does not own domain state.

It conditionally renders domain controls by `editorLevel`:

- **shape**: sprite list, enable toggles, axis constraint toggles, add/remove handles
- **rosette**: order, mirror adjacency, line thickness
- **tiling**: lattice, symmetry, branch order, rings, spacing, inter-cell rotation, base rotation, fold progression, fixed cell id

It also exposes global actions: **reset project**, **undo**, **redo**.

### 3.3 Canvas renderer: `RosetteCanvas`

`RosetteCanvas` renders the visual scene using `react-konva` (`Stage`, `Layer`, `Group`, `Line`, `Circle`).

Key rendering behavior:

- Supports viewport interaction:
  - wheel zoom
  - space+drag panning
- Draws radial guides for all levels
- Draws motif curves by domain:
  - shape/rosette: `transformedCurves`
  - tiling: each pose draws transformed `rosetteCurvesFromSlice`
- Draws tiling edges/centers from `tessellationMechanism`
- Enables shape editing on top layer:
  - sprite line click to set active + insert point on nearest segment
  - draggable amber handles for active sprite

### 3.4 Context badge: `EditingBadge`

`EditingBadge` displays the active domain metadata (`LEVEL_META`), reinforcing the current editing mode.

---

## 4) UI data flow (interaction to pixels)

1. User action in panel/canvas (slider, checkbox, drag, click).
2. Callback in `RosetteMechanism` performs `commit(...)` update.
3. `present` project state changes; history is extended and future stack cleared.
4. Memoized domain functions recompute derived arrays/mechanism.
5. `RosetteCanvas` re-renders declaratively from new props.

This keeps geometry deterministic and testable while keeping rendering concerns isolated from domain math.

---

## 5) Display architecture by editor level

### Shape level

- Emphasis: local motif authoring.
- Visuals:
  - low-opacity rosette preview
  - sprite polylines (active highlighted)
  - draggable handles
- Interactions:
  - move handles
  - insert/remove points
  - toggle sprite and axis constraints

### Rosette level

- Emphasis: rotational composition.
- Visuals:
  - stronger radial guides
  - replicated rosette curves
- Interactions:
  - adjust order/mirroring/thickness

### Tiling level

- Emphasis: inter-cell structure.
- Visuals:
  - rosette instances per pose
  - edge graph between parent/child cells
  - root/fixed markers with semantic colors
- Interactions:
  - lattice/symmetry/branch-order adjustments
  - fold/glide/orientation controls

---

## 6) File map (UI-focused)

- `src/components/RosetteMechanism.tsx` — orchestration, state lifecycle, derived pipeline
- `src/components/rosette/components/RosetteControlsPanel.tsx` — domain-specific controls
- `src/components/rosette/components/RosetteCanvas.tsx` — Konva rendering + direct manipulation
- `src/components/rosette/components/EditingBadge.tsx` — active mode indicator
- `src/components/rosette/domains/sprite.ts` — shape domain logic
- `src/components/rosette/domains/rosette.ts` — rosette replication logic
- `src/components/rosette/domains/tessellation.ts` — tiling mechanism logic
- `src/components/rosette/types.ts` — shared contracts between domains and UI
- `src/components/rosette/constants.ts` — limits/defaults/domain metadata
