import { useMemo } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createJSONStorage, persist, subscribeWithSelector, type StateStorage } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import {
  MAX_BASE_ORIENTATION_DEG,
  MIN_BASE_ORIENTATION_DEG,
} from "../constants";
import {
  addPoint,
  addSprite,
  getActiveSprite,
  removePoint,
  removeSprite,
  setActiveSprite,
  setSpriteAxisConstraintMode,
  setSpriteEnabled,
  updateHandleLocal,
} from "../domains/sprite";
import { rotatePoint } from "../math";
import { createDefaultProjectState } from "../projectState";
import { invariant } from "../invariant";
import {
  EditorLevel,
  Point,
  RosetteProjectState,
  TessellationBranchOrder,
  TessellationSymmetry,
  TilingLattice,
} from "../types";

export type HistoryState = {
  past: RosetteProjectState[];
  present: RosetteProjectState;
  future: RosetteProjectState[];
};

const createInitialHistoryState = (): HistoryState => ({
  past: [],
  present: createDefaultProjectState(),
  future: [],
});

const STORAGE_KEY = "rosette-project-state";
const isHydratingRef = { current: false };

const isTransientAction = (action: EditorAction) => action.type === "UPDATE_SPRITE_HANDLE";

const clearPersistedEditorState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best effort only. Some environments (private mode / restricted storage)
    // can reject localStorage writes/removals.
  }
};

const isValidRosetteProjectState = (value: unknown): value is RosetteProjectState => {
  if (typeof value !== "object" || value == null) return false;
  const candidate = value as Partial<RosetteProjectState>;
  return (
    typeof candidate.editorLevel === "string" &&
    typeof candidate.order === "number" &&
    typeof candidate.lineThickness === "number" &&
    typeof candidate.baseOrientationDeg === "number" &&
    typeof candidate.mirrorAdjacency === "boolean" &&
    typeof candidate.tilingLattice === "string" &&
    typeof candidate.tilingSpacing === "number" &&
    typeof candidate.tilingRings === "number" &&
    typeof candidate.interCellRotation === "number" &&
    typeof candidate.tessellationSymmetry === "string" &&
    typeof candidate.tessellationBranchOrder === "string" &&
    typeof candidate.foldProgress === "number" &&
    typeof candidate.fixedCellId === "string" &&
    typeof candidate.sliceState === "object" &&
    candidate.sliceState != null &&
    Array.isArray((candidate.sliceState as { sprites?: unknown }).sprites)
  );
};

const createDebouncedStorage = (storage: StateStorage, debounceMs = 250): StateStorage => {
  const timeoutMap = new Map<string, ReturnType<typeof setTimeout>>();
  const pendingWrites = new Map<string, string>();

  return {
    getItem: (name) => {
      try {
        const raw = storage.getItem(name);
        if (raw == null) return null;

        // Validate payload before Zustand attempts to parse it.
        // If malformed/corrupt, drop it and continue with defaults.
        JSON.parse(raw);
        return raw;
      } catch {
        try {
          storage.removeItem(name);
        } catch {
          // Ignore cleanup failures; caller will continue with in-memory state.
        }
        return null;
      }
    },
    setItem: (name, value) => {
      if (timeoutMap.has(name)) clearTimeout(timeoutMap.get(name));
      pendingWrites.set(name, value);
      const timer = setTimeout(() => {
        const payload = pendingWrites.get(name);
        if (payload == null) return;
        try {
          storage.setItem(name, payload);
        } catch {
          // Best effort persistence only.
        }
        pendingWrites.delete(name);
        timeoutMap.delete(name);
      }, debounceMs);
      timeoutMap.set(name, timer);
    },
    removeItem: (name) => {
      if (timeoutMap.has(name)) {
        clearTimeout(timeoutMap.get(name));
        timeoutMap.delete(name);
      }
      pendingWrites.delete(name);
      try {
        storage.removeItem(name);
      } catch {
        // Best effort persistence only.
      }
    },
  };
};

type FieldPatch = Partial<
  Pick<
    RosetteProjectState,
    | "editorLevel"
    | "order"
    | "lineThickness"
    | "baseOrientationDeg"
    | "mirrorAdjacency"
    | "tilingLattice"
    | "tilingSpacing"
    | "tilingRings"
    | "interCellRotation"
    | "tessellationSymmetry"
    | "tessellationBranchOrder"
    | "foldProgress"
    | "fixedCellId"
  >
>;

type EditorAction =
  | { type: "PATCH_FIELDS"; patch: FieldPatch }
  | { type: "SET_HISTORY"; history: HistoryState }
  | { type: "RESET" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_ACTIVE_SPRITE"; spriteId: string }
  | { type: "SET_SPRITE_ENABLED"; spriteId: string; enabled: boolean }
  | { type: "SET_SPRITE_AXIS_CONSTRAINT"; spriteId: string; enabled: boolean }
  | { type: "ADD_SPRITE" }
  | { type: "REMOVE_SPRITE"; spriteId: string }
  | { type: "ADD_HANDLE" }
  | { type: "REMOVE_HANDLE" }
  | {
      type: "UPDATE_SPRITE_HANDLE";
      handleIndex: number;
      globalPoint: Point;
      center: Point;
      baseRotation: number;
    }
  | { type: "INSERT_HANDLE_ON_SEGMENT"; spriteId: string; point: Point; center: Point; baseRotation: number };

type EditorStore = HistoryState & {
  hasHydrated: boolean;
  dispatchAction: (action: EditorAction) => void;
  setHistory: (history: HistoryState) => void;
  snapshot: () => void;
};

const useEditorStore = create<EditorStore>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        ...createInitialHistoryState(),
        hasHydrated: false,
        setHistory: (history) =>
          set((state) => {
            state.past = history.past;
            state.present = history.present;
            state.future = history.future;
          }),
        snapshot: () =>
          set((state) => {
            state.past.push(state.present);
            state.future = [];
          }),
        dispatchAction: (action) => {
          if (isHydratingRef.current) {
            if (!isTransientAction(action)) {
              invariant(false, "State update blocked while hydrating", {
                context: { action: action.type },
                recoverable: true,
              });
            }
            return;
          }

          const applyCommittedUpdate = (updater: (current: RosetteProjectState) => RosetteProjectState) => {
            set((state) => {
              const nextPresent = updater(state.present);
              if (nextPresent === state.present) return;
              state.past.push(state.present);
              state.present = nextPresent;
              state.future = [];
            });
          };

          const applyTransientUpdate = (updater: (current: RosetteProjectState) => RosetteProjectState) => {
            set((state) => {
              const nextPresent = updater(state.present);
              if (nextPresent === state.present) return;
              state.present = nextPresent;
            });
          };

          switch (action.type) {
            case "SET_HISTORY":
              set((state) => {
                state.past = action.history.past;
                state.present = action.history.present;
                state.future = action.history.future;
              });
              break;
            case "RESET":
              set(() => ({ ...createInitialHistoryState(), hasHydrated: true }));
              break;
            case "UNDO": {
              set((state) => {
                if (state.past.length === 0) return;
                const previous = state.past[state.past.length - 1];
                state.past = state.past.slice(0, -1);
                state.future = [state.present, ...state.future];
                state.present = previous;
              });
              break;
            }
            case "REDO": {
              set((state) => {
                if (state.future.length === 0) return;
                const [next, ...restFuture] = state.future;
                state.past.push(state.present);
                state.present = next;
                state.future = restFuture;
              });
              break;
            }
            case "PATCH_FIELDS":
              applyCommittedUpdate((current) => ({
                ...current,
                ...action.patch,
                baseOrientationDeg:
                  action.patch.baseOrientationDeg == null
                    ? current.baseOrientationDeg
                    : Math.min(
                        MAX_BASE_ORIENTATION_DEG,
                        Math.max(MIN_BASE_ORIENTATION_DEG, action.patch.baseOrientationDeg),
                      ),
              }));
              break;
            case "SET_ACTIVE_SPRITE":
              applyCommittedUpdate((current) => ({
                ...current,
                sliceState: setActiveSprite(current.sliceState, action.spriteId),
              }));
              break;
            case "SET_SPRITE_ENABLED":
              applyCommittedUpdate((current) => ({
                ...current,
                sliceState: setSpriteEnabled(current.sliceState, action.spriteId, action.enabled),
              }));
              break;
            case "SET_SPRITE_AXIS_CONSTRAINT":
              applyCommittedUpdate((current) => ({
                ...current,
                sliceState: setSpriteAxisConstraintMode(
                  current.sliceState,
                  action.spriteId,
                  action.enabled ? "endpoints-on-axis" : "none",
                ),
              }));
              break;
            case "ADD_SPRITE":
              applyCommittedUpdate((current) => ({ ...current, sliceState: addSprite(current.sliceState) }));
              break;
            case "REMOVE_SPRITE":
              applyCommittedUpdate((current) => ({
                ...current,
                sliceState: removeSprite(current.sliceState, action.spriteId),
              }));
              break;
            case "ADD_HANDLE":
              applyCommittedUpdate((current) => {
                const activeSprite = getActiveSprite(current.sliceState);
                if (current.editorLevel !== "shape" || !activeSprite) return current;
                return {
                  ...current,
                  sliceState: addPoint(current.sliceState, activeSprite.id, { type: "append" }),
                };
              });
              break;
            case "REMOVE_HANDLE":
              applyCommittedUpdate((current) => {
                const activeSprite = getActiveSprite(current.sliceState);
                if (current.editorLevel !== "shape" || !activeSprite) return current;
                return {
                  ...current,
                  sliceState: removePoint(current.sliceState, activeSprite.id, "last"),
                };
              });
              break;
            case "UPDATE_SPRITE_HANDLE":
              applyTransientUpdate((current) => {
                const activeSprite = getActiveSprite(current.sliceState);
                if (current.editorLevel !== "shape" || !activeSprite) return current;
                return {
                  ...current,
                  sliceState: updateHandleLocal(
                    current.sliceState,
                    activeSprite.id,
                    action.handleIndex,
                    action.globalPoint,
                    action.center,
                    action.baseRotation,
                  ),
                };
              });
              break;
            case "INSERT_HANDLE_ON_SEGMENT":
              applyCommittedUpdate((current) => {
                if (current.editorLevel !== "shape") return current;
                const centeredPoint = {
                  x: action.point.x - action.center.x,
                  y: action.point.y - action.center.y,
                };
                const localPoint = rotatePoint(centeredPoint, -action.baseRotation);
                return {
                  ...current,
                  sliceState: addPoint(current.sliceState, action.spriteId, {
                    type: "insert-on-segment",
                    point: localPoint,
                    tolerance: 24,
                  }),
                };
              });
              break;
          }
        },
      })),
      {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => createDebouncedStorage(localStorage, 250)),
        partialize: (state) => ({ present: state.present }),
        onRehydrateStorage: () => {
          isHydratingRef.current = true;
          return (_rehydratedState, error) => {
            try {
              if (error) {
                invariant(false, "Editor store hydration failed", {
                  context: error,
                  recoverable: true,
                });
                clearPersistedEditorState();
              }

              // Defer state update to avoid referencing `useEditorStore` during
              // its own initialization (TDZ / ReferenceError).
              queueMicrotask(() => {
                useEditorStore.setState((state) => ({
                  ...state,
                  past: [],
                  future: [],
                  hasHydrated: true,
                }));
              });
            } finally {
              isHydratingRef.current = false;
            }
          };
        },
        merge: (persistedState, currentState) => {
          const persisted = persistedState as Partial<HistoryState> | undefined;

          if (persisted?.present != null && !isValidRosetteProjectState(persisted.present)) {
            invariant(false, "Invalid persisted Rosette project state shape", {
              context: persisted.present,
              recoverable: true,
            });
            clearPersistedEditorState();
            return {
              ...currentState,
              present: currentState.present,
              past: [],
              future: [],
            };
          }

          return {
            ...currentState,
            present: persisted?.present ?? currentState.present,
            past: [],
            future: [],
          };
        },
      },
    ),
  ),
);

export const useEditorState = () => useEditorStore((state) => state.present);

export const useEditorHistory = () => {
  const past = useEditorStore((state) => state.past);
  const present = useEditorStore((state) => state.present);
  const future = useEditorStore((state) => state.future);

  return useMemo(
    () => ({
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      history: { past, present, future },
    }),
    [past, present, future],
  );
};

export const useEditorActions = () => {
  const dispatchAction = useEditorStore((state) => state.dispatchAction);
  const setHistory = useEditorStore((state) => state.setHistory);
  const snapshot = useEditorStore((state) => state.snapshot);
  return useMemo(
    () => ({
      setHistory,
      snapshot,
      reset: () => dispatchAction({ type: "RESET" }),
      undo: () => dispatchAction({ type: "UNDO" }),
      redo: () => dispatchAction({ type: "REDO" }),
      setEditorLevel: (editorLevel: EditorLevel) => dispatchAction({ type: "PATCH_FIELDS", patch: { editorLevel } }),
      setOrder: (order: number) => dispatchAction({ type: "PATCH_FIELDS", patch: { order } }),
      setLineThickness: (lineThickness: number) => dispatchAction({ type: "PATCH_FIELDS", patch: { lineThickness } }),
      setBaseOrientationDeg: (baseOrientationDeg: number) =>
        dispatchAction({ type: "PATCH_FIELDS", patch: { baseOrientationDeg } }),
      setMirrorAdjacency: (mirrorAdjacency: boolean) => dispatchAction({ type: "PATCH_FIELDS", patch: { mirrorAdjacency } }),
      setTilingLattice: (tilingLattice: TilingLattice) => dispatchAction({ type: "PATCH_FIELDS", patch: { tilingLattice } }),
      setTessellationSymmetry: (tessellationSymmetry: TessellationSymmetry) =>
        dispatchAction({ type: "PATCH_FIELDS", patch: { tessellationSymmetry } }),
      setTessellationBranchOrder: (tessellationBranchOrder: TessellationBranchOrder) =>
        dispatchAction({ type: "PATCH_FIELDS", patch: { tessellationBranchOrder } }),
      setTilingRings: (tilingRings: number) => dispatchAction({ type: "PATCH_FIELDS", patch: { tilingRings } }),
      setTilingSpacing: (tilingSpacing: number) => dispatchAction({ type: "PATCH_FIELDS", patch: { tilingSpacing } }),
      setInterCellRotation: (interCellRotation: number) =>
        dispatchAction({ type: "PATCH_FIELDS", patch: { interCellRotation } }),
      setFoldProgress: (foldProgress: number) => dispatchAction({ type: "PATCH_FIELDS", patch: { foldProgress } }),
      setFixedCellId: (fixedCellId: string) => dispatchAction({ type: "PATCH_FIELDS", patch: { fixedCellId } }),
      setActiveSprite: (spriteId: string) => dispatchAction({ type: "SET_ACTIVE_SPRITE", spriteId }),
      setSpriteEnabled: (spriteId: string, enabled: boolean) =>
        dispatchAction({ type: "SET_SPRITE_ENABLED", spriteId, enabled }),
      setSpriteAxisConstraint: (spriteId: string, enabled: boolean) =>
        dispatchAction({ type: "SET_SPRITE_AXIS_CONSTRAINT", spriteId, enabled }),
      addSprite: () => dispatchAction({ type: "ADD_SPRITE" }),
      removeSprite: (spriteId: string) => dispatchAction({ type: "REMOVE_SPRITE", spriteId }),
      addHandle: () => dispatchAction({ type: "ADD_HANDLE" }),
      removeHandle: () => dispatchAction({ type: "REMOVE_HANDLE" }),
      updateSpriteHandle: (handleIndex: number, globalPoint: Point, center: Point, baseRotation: number) =>
        dispatchAction({ type: "UPDATE_SPRITE_HANDLE", handleIndex, globalPoint, center, baseRotation }),
      insertHandleOnSegment: (spriteId: string, point: Point, center: Point, baseRotation: number) =>
        dispatchAction({ type: "INSERT_HANDLE_ON_SEGMENT", spriteId, point, center, baseRotation }),
    }),
    [dispatchAction, setHistory, snapshot],
  );
};

export const useEditorStateSnapshot = () =>
  useEditorStore(
    useShallow((state) => ({
      past: state.past,
      present: state.present,
      future: state.future,
    })),
  );

export const useEditorCommit = () => useEditorStore((state) => state.setHistory);
