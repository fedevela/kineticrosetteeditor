import { NextResponse } from "next/server";
import { createDefaultProjectState } from "@/components/rosette/projectState";
import { RosetteProjectState } from "@/components/rosette/types";
import { initProjectDb, loadProjectStateJson, saveProjectStateJson } from "@/lib/sqlite";

export const runtime = "nodejs";

const getDefaultState = () => createDefaultProjectState();

const normalizeState = (input: unknown): RosetteProjectState => {
  const defaults = getDefaultState();
  if (!input || typeof input !== "object") return defaults;

  const candidate = input as Record<string, unknown>;
  const migratedSliceState = (() => {
    const nextSliceState = candidate.sliceState as Record<string, unknown> | undefined;
    if (nextSliceState && Array.isArray(nextSliceState.sprites)) {
      const sprites = nextSliceState.sprites;
      const activeSpriteId =
        typeof nextSliceState.activeSpriteId === "string"
          ? nextSliceState.activeSpriteId
          : (sprites[0] as { id?: string } | undefined)?.id;
      return { activeSpriteId: activeSpriteId ?? defaults.sliceState.activeSpriteId, sprites };
    }

    const legacyBaseState = candidate.baseState as Record<string, unknown> | undefined;
    if (!legacyBaseState || !Array.isArray(legacyBaseState.shapes)) return defaults.sliceState;

    const sprites = legacyBaseState.shapes;
    const activeSpriteId =
      typeof legacyBaseState.activeShapeId === "string"
        ? legacyBaseState.activeShapeId
        : (sprites[0] as { id?: string } | undefined)?.id;
    return { activeSpriteId: activeSpriteId ?? defaults.sliceState.activeSpriteId, sprites };
  })();

  return {
    ...defaults,
    ...candidate,
    sliceState: migratedSliceState,
  } as RosetteProjectState;
};

const safeParseState = (input: string | undefined): RosetteProjectState => {
  if (!input) return getDefaultState();
  try {
    return normalizeState(JSON.parse(input));
  } catch {
    return getDefaultState();
  }
};

export async function GET() {
  const defaultState = getDefaultState();
  await initProjectDb(JSON.stringify(defaultState));
  const stateJson = await loadProjectStateJson();
  const state = safeParseState(stateJson);
  return NextResponse.json({ state });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { state?: RosetteProjectState };
  if (!body?.state) {
    return NextResponse.json({ error: "Missing state payload" }, { status: 400 });
  }

  await initProjectDb(JSON.stringify(getDefaultState()));
  await saveProjectStateJson(JSON.stringify(body.state));
  return NextResponse.json({ ok: true });
}
