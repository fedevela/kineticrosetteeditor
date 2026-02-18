import { NextResponse } from "next/server";
import { createDefaultProjectState } from "@/components/rosette/projectState";
import { RosetteProjectState } from "@/components/rosette/types";
import { initProjectDb, loadProjectStateJson, saveProjectStateJson } from "@/lib/sqlite";

export const runtime = "nodejs";

const getDefaultState = () => createDefaultProjectState();

const safeParseState = (input: string | undefined): RosetteProjectState => {
  if (!input) return getDefaultState();
  try {
    return JSON.parse(input) as RosetteProjectState;
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
