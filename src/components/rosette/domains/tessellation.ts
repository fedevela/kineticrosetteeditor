import { TilingCell, TilingLattice } from "../types";

export const buildTilingCells = (
  tilingLattice: TilingLattice,
  tilingRings: number,
  tilingSpacing: number,
): TilingCell[] => {
  const spacing = tilingSpacing;

  if (tilingLattice === "square") {
    return Array.from({ length: tilingRings * 2 + 1 }, (_, rowOffset) => {
      const row = rowOffset - tilingRings;

      return Array.from({ length: tilingRings * 2 + 1 }, (_, colOffset) => {
        const col = colOffset - tilingRings;
        const ring = Math.max(Math.abs(row), Math.abs(col));

        return {
          x: col * spacing,
          y: row * spacing,
          ring,
        };
      });
    }).flat();
  }

  const sin60 = Math.sqrt(3) / 2;
  const cells: TilingCell[] = [];

  for (let r = -tilingRings; r <= tilingRings; r += 1) {
    for (let q = -tilingRings; q <= tilingRings; q += 1) {
      const s = -q - r;
      const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      if (ring > tilingRings) continue;

      cells.push({
        x: spacing * (q + r / 2),
        y: spacing * sin60 * r,
        ring,
      });
    }
  }

  return cells;
};
