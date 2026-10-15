import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_TRANSITION_MS = 380;

export function useSequentialDialog(onClose, transitionMs = DEFAULT_TRANSITION_MS) {
  const [phase, setPhase] = useState("primary");
  const timerRef = useRef(null);

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
    },
    [],
  );

  const showResult = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setPhase("transition");
    timerRef.current = window.setTimeout(() => {
      setPhase("result");
    }, transitionMs);
  }, [transitionMs]);

  const closeAll = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setPhase("closed");
    onClose(false);
  }, [onClose]);

  return {
    primaryOpen: phase === "primary",
    resultOpen: phase === "result",
    showResult,
    closeAll,
  };
}
