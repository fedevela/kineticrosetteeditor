# Kinetic Rosette Patterns and Tessellations

Interactive geometric editor for building kinetic rosette motifs and tessellations from reusable sprite slices.

## Stack

- React 19 + TypeScript
- Vite 7
- React Router 7
- react-konva / Konva for 2D rendering
- Playwright for end-to-end tests

## Run locally

```bash
npm install
npm run dev
```

Build and preview production output:

```bash
npm run build
npm run start
```

Useful commands:

```bash
npm run lint
npm run test:e2e
```

## Conceptual model

The editor works in three levels:

1. **Shape**: author one or more sprite polylines (add/remove points, drag handles, axis constraints).
2. **Rosette**: replicate enabled sprites by rotational order with optional mirrored adjacency.
3. **Tiling**: distribute rosette instances on square or hex lattices and propagate orientation through tessellation rules.

## Main capabilities

- Multi-sprite slice editing (per-sprite enable and endpoint axis-lock options)
- Real-time rotational rosette preview
- Tiling on square/hex lattices with branch traversal modes
- Tessellation symmetry modes: translation, reflection, glide
- Fold/inter-cell rotation controls for kinetic behavior
- Undo/redo project history and local persistence via `localStorage`
- Zoom/pan canvas interaction (wheel zoom + space-drag)

## Project structure (high-level)

- `src/components/RosetteMechanism.tsx` — composition root
- `src/components/rosette/state/editorStore.tsx` — project state + actions/history
- `src/components/rosette/domains/*` — pure geometry/domain logic
- `src/components/rosette/components/*` — controls and Konva renderer
- `src/components/rosette/hooks/*` — persistence, viewport/container, derived geometry

## References

V. Beatini, *Int. J. Comp. Meth. and Exp. Meas.*, Vol. 5, No. 4 (2017) 631–641  
**Kinetic Rosette Patterns and Tessellations**
