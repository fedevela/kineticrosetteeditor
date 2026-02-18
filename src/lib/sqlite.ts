import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";

const resolveDbPath = () => {
  const configuredPath = process.env.ROSETTE_DB_PATH;
  if (!configuredPath) return path.join(process.cwd(), "data", "rosette.db");
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(process.cwd(), configuredPath);
};

const DB_PATH = resolveDbPath();

let dbInstance: sqlite3.Database | null = null;

const ensureDb = () => {
  if (dbInstance) return dbInstance;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  dbInstance = new sqlite3.Database(DB_PATH);
  return dbInstance;
};

const run = (sql: string, params: unknown[] = []) =>
  new Promise<void>((resolve, reject) => {
    ensureDb().run(sql, params, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

const get = <T>(sql: string, params: unknown[] = []) =>
  new Promise<T | undefined>((resolve, reject) => {
    ensureDb().get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row as T | undefined);
    });
  });

let initialized = false;

export const initProjectDb = async (defaultStateJson: string) => {
  if (initialized) return;
  await run("CREATE TABLE IF NOT EXISTS project_state (id INTEGER PRIMARY KEY CHECK (id = 1), state_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
  await run(
    "INSERT INTO project_state (id, state_json) VALUES (1, ?) ON CONFLICT(id) DO NOTHING",
    [defaultStateJson],
  );
  initialized = true;
};

export const loadProjectStateJson = async () => {
  const row = await get<{ state_json: string }>("SELECT state_json FROM project_state WHERE id = 1");
  return row?.state_json;
};

export const saveProjectStateJson = async (stateJson: string) => {
  await run(
    "UPDATE project_state SET state_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
    [stateJson],
  );
};
