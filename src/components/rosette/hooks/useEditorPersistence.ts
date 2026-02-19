import { useEffect, useRef, useState } from "react";
import { RosetteProjectState } from "../types";
import { HistoryState } from "../state/editorStore";

const STORAGE_KEY = "rosette-project-state";

type UseEditorPersistenceInput = {
  state: RosetteProjectState;
  setHistory: (history: HistoryState) => void;
};

export const useEditorPersistence = ({ state, setHistory }: UseEditorPersistenceInput) => {
  const [hasHydrated, setHasHydrated] = useState(false);
  const isHydratingRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    isHydratingRef.current = true;

    try {
      const serializedState = localStorage.getItem(STORAGE_KEY);
      if (serializedState) {
        const persistedState = JSON.parse(serializedState) as RosetteProjectState;
        if (!cancelled) {
          setHistory({ past: [], present: persistedState, future: [] });
        }
      }
    } catch {
      // Ignore storage hydration issues and continue with defaults.
    } finally {
      if (!cancelled) {
        isHydratingRef.current = false;
        setHasHydrated(true);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [setHistory]);

  useEffect(() => {
    if (!hasHydrated || isHydratingRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Ignore storage write issues (e.g. quota).
      }
    }, 250);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [hasHydrated, state]);
};
