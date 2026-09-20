import { useEffect, useSyncExternalStore } from "react";
import { windowModeController } from "./windowModeController";

export function useWindowMode() {
  const state = useSyncExternalStore(windowModeController.subscribe, windowModeController.getSnapshot);

  useEffect(() => {
    void windowModeController.initialize();
  }, []);

  return {
    ...state,
    togglePin: windowModeController.togglePin,
    toggleOverlay: windowModeController.toggleOverlay,
    close: windowModeController.close,
  };
}
