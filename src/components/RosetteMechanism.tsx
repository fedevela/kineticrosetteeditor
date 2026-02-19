"use client";

import { RosetteEditorProvider, useEditorActions, useEditorState } from "./rosette/state/editorStore";
import { RosetteControlsPanel } from "./rosette/components/RosetteControlsPanel";
import { EditingBadge } from "./rosette/components/EditingBadge";
import { RosetteCanvas } from "./rosette/components/RosetteCanvas";
import { useContainerSize } from "./rosette/hooks/useContainerSize";
import { useEditorPersistence } from "./rosette/hooks/useEditorPersistence";

function RosetteMechanismContent() {
  const { containerRef, size } = useContainerSize();
  const state = useEditorState();
  const actions = useEditorActions();

  useEditorPersistence({ state, setHistory: actions.setHistory });

  return (
    <div ref={containerRef} className="rosette-root">
      <RosetteControlsPanel />
      <EditingBadge />
      <RosetteCanvas size={size} />
    </div>
  );
}

export function RosetteMechanism() {
  return (
    <RosetteEditorProvider>
      <RosetteMechanismContent />
    </RosetteEditorProvider>
  );
}
