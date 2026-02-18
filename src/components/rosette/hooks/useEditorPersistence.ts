"use client";

import { useEffect, useRef, useState } from "react";
import { RosetteProjectState } from "../types";
import { HistoryState } from "../state/editorStore";

type UseEditorPersistenceInput = {
  state: RosetteProjectState;
  setHistory: (history: HistoryState) => void;
};

export const useEditorPersistence = ({ state, setHistory }: UseEditorPersistenceInput) => {
  const [hasHydrated, setHasHydrated] = useState(false);
  const isHydratingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;
    isHydratingRef.current = true;

    (async () => {
      try {
        const response = await fetch("/api/project", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { state?: RosetteProjectState };
        if (cancelled || !data.state) return;
        setHistory({ past: [], present: data.state, future: [] });
      } finally {
        if (!cancelled) {
          isHydratingRef.current = false;
          setHasHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setHistory]);

  useEffect(() => {
    if (!hasHydrated || isHydratingRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      void fetch("/api/project", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
    }, 250);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [hasHydrated, state]);
};
