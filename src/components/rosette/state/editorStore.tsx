"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type PropsWithChildren,
} from "react";
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

const applyPresentUpdate = (
  state: HistoryState,
  updater: (current: RosetteProjectState) => RosetteProjectState,
): HistoryState => {
  const nextPresent = updater(state.present);
  if (JSON.stringify(nextPresent) === JSON.stringify(state.present)) return state;
  return {
    past: [...state.past, state.present],
    present: nextPresent,
    future: [],
  };
};

const editorReducer = (state: HistoryState, action: EditorAction): HistoryState => {
  switch (action.type) {
    case "SET_HISTORY":
      return action.history;
    case "RESET":
      return createInitialHistoryState();
    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case "REDO": {
      if (state.future.length === 0) return state;
      const [next, ...restFuture] = state.future;
      return {
        past: [...state.past, state.present],
        present: next,
        future: restFuture,
      };
    }
    case "PATCH_FIELDS":
      return applyPresentUpdate(state, (current) => ({
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
    case "SET_ACTIVE_SPRITE":
      return applyPresentUpdate(state, (current) => ({
        ...current,
        sliceState: setActiveSprite(current.sliceState, action.spriteId),
      }));
    case "SET_SPRITE_ENABLED":
      return applyPresentUpdate(state, (current) => ({
        ...current,
        sliceState: setSpriteEnabled(current.sliceState, action.spriteId, action.enabled),
      }));
    case "SET_SPRITE_AXIS_CONSTRAINT":
      return applyPresentUpdate(state, (current) => ({
        ...current,
        sliceState: setSpriteAxisConstraintMode(
          current.sliceState,
          action.spriteId,
          action.enabled ? "endpoints-on-axis" : "none",
        ),
      }));
    case "ADD_SPRITE":
      return applyPresentUpdate(state, (current) => ({ ...current, sliceState: addSprite(current.sliceState) }));
    case "REMOVE_SPRITE":
      return applyPresentUpdate(state, (current) => ({
        ...current,
        sliceState: removeSprite(current.sliceState, action.spriteId),
      }));
    case "ADD_HANDLE":
      return applyPresentUpdate(state, (current) => {
        const activeSprite = getActiveSprite(current.sliceState);
        if (current.editorLevel !== "shape" || !activeSprite) return current;
        return {
          ...current,
          sliceState: addPoint(current.sliceState, activeSprite.id, { type: "append" }),
        };
      });
    case "REMOVE_HANDLE":
      return applyPresentUpdate(state, (current) => {
        const activeSprite = getActiveSprite(current.sliceState);
        if (current.editorLevel !== "shape" || !activeSprite) return current;
        return {
          ...current,
          sliceState: removePoint(current.sliceState, activeSprite.id, "last"),
        };
      });
    case "UPDATE_SPRITE_HANDLE":
      return applyPresentUpdate(state, (current) => {
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
    case "INSERT_HANDLE_ON_SEGMENT":
      return applyPresentUpdate(state, (current) => {
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
    default:
      return state;
  }
};

type EditorContextValue = {
  history: HistoryState;
  state: RosetteProjectState;
  dispatch: Dispatch<EditorAction>;
};

const EditorContext = createContext<EditorContextValue | null>(null);

export function RosetteEditorProvider({ children }: PropsWithChildren) {
  const [history, dispatch] = useReducer(editorReducer, undefined, createInitialHistoryState);
  const value = useMemo(
    () => ({ history, state: history.present, dispatch }),
    [history, dispatch],
  );
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) throw new Error("Rosette editor hooks must be used within RosetteEditorProvider");
  return context;
};

export const useEditorState = () => useEditorContext().state;

export const useEditorHistory = () => {
  const { history } = useEditorContext();
  return {
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    history,
  };
};

export const useEditorActions = () => {
  const { dispatch } = useEditorContext();
  return useMemo(
    () => ({
      setHistory: (history: HistoryState) => dispatch({ type: "SET_HISTORY", history }),
      reset: () => dispatch({ type: "RESET" }),
      undo: () => dispatch({ type: "UNDO" }),
      redo: () => dispatch({ type: "REDO" }),
      setEditorLevel: (editorLevel: EditorLevel) => dispatch({ type: "PATCH_FIELDS", patch: { editorLevel } }),
      setOrder: (order: number) => dispatch({ type: "PATCH_FIELDS", patch: { order } }),
      setLineThickness: (lineThickness: number) => dispatch({ type: "PATCH_FIELDS", patch: { lineThickness } }),
      setBaseOrientationDeg: (baseOrientationDeg: number) =>
        dispatch({ type: "PATCH_FIELDS", patch: { baseOrientationDeg } }),
      setMirrorAdjacency: (mirrorAdjacency: boolean) =>
        dispatch({ type: "PATCH_FIELDS", patch: { mirrorAdjacency } }),
      setTilingLattice: (tilingLattice: TilingLattice) =>
        dispatch({ type: "PATCH_FIELDS", patch: { tilingLattice } }),
      setTessellationSymmetry: (tessellationSymmetry: TessellationSymmetry) =>
        dispatch({ type: "PATCH_FIELDS", patch: { tessellationSymmetry } }),
      setTessellationBranchOrder: (tessellationBranchOrder: TessellationBranchOrder) =>
        dispatch({ type: "PATCH_FIELDS", patch: { tessellationBranchOrder } }),
      setTilingRings: (tilingRings: number) => dispatch({ type: "PATCH_FIELDS", patch: { tilingRings } }),
      setTilingSpacing: (tilingSpacing: number) => dispatch({ type: "PATCH_FIELDS", patch: { tilingSpacing } }),
      setInterCellRotation: (interCellRotation: number) =>
        dispatch({ type: "PATCH_FIELDS", patch: { interCellRotation } }),
      setFoldProgress: (foldProgress: number) => dispatch({ type: "PATCH_FIELDS", patch: { foldProgress } }),
      setFixedCellId: (fixedCellId: string) => dispatch({ type: "PATCH_FIELDS", patch: { fixedCellId } }),
      setActiveSprite: (spriteId: string) => dispatch({ type: "SET_ACTIVE_SPRITE", spriteId }),
      setSpriteEnabled: (spriteId: string, enabled: boolean) =>
        dispatch({ type: "SET_SPRITE_ENABLED", spriteId, enabled }),
      setSpriteAxisConstraint: (spriteId: string, enabled: boolean) =>
        dispatch({ type: "SET_SPRITE_AXIS_CONSTRAINT", spriteId, enabled }),
      addSprite: () => dispatch({ type: "ADD_SPRITE" }),
      removeSprite: (spriteId: string) => dispatch({ type: "REMOVE_SPRITE", spriteId }),
      addHandle: () => dispatch({ type: "ADD_HANDLE" }),
      removeHandle: () => dispatch({ type: "REMOVE_HANDLE" }),
      updateSpriteHandle: (handleIndex: number, globalPoint: Point, center: Point, baseRotation: number) =>
        dispatch({ type: "UPDATE_SPRITE_HANDLE", handleIndex, globalPoint, center, baseRotation }),
      insertHandleOnSegment: (spriteId: string, point: Point, center: Point, baseRotation: number) =>
        dispatch({ type: "INSERT_HANDLE_ON_SEGMENT", spriteId, point, center, baseRotation }),
    }),
    [dispatch],
  );
};

export const useEditorStateSnapshot = () => useEditorContext().history;

export const useEditorCommit = () => {
  const { dispatch } = useEditorContext();
  return useCallback((history: HistoryState) => dispatch({ type: "SET_HISTORY", history }), [dispatch]);
};
