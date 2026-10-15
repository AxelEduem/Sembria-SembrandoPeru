import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";

function VisibleFeedbackToast({ feedback, onClose }) {
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const onCloseRef = useRef(onClose);
  const exitTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const closeAnimationTimerRef = useRef(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Los warnings (p. ej. "correo no enviado") requieren más tiempo de lectura.
    const isWarning = feedback.type === "warning";
    const exitDelay = isWarning ? 5600 : 3200;
    const closeDelay = isWarning ? 6000 : 3500;

    animationFrameRef.current = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    exitTimerRef.current = window.setTimeout(() => {
      setIsExiting(true);
    }, exitDelay);

    closeTimerRef.current = window.setTimeout(() => {
      onCloseRef.current?.();
    }, closeDelay);

    return () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
      }

      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }

      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [feedback]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
      }

      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }

      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      if (closeAnimationTimerRef.current) {
        window.clearTimeout(closeAnimationTimerRef.current);
      }
    };
  }, []);

  const isSuccess = feedback.type === "success";
  const isWarning = feedback.type === "warning";
  const Icon = isSuccess ? CheckCircle2 : isWarning ? AlertTriangle : XCircle;

  function handleClose() {
    if (isExiting) {
      return;
    }

    setIsExiting(true);

    closeAnimationTimerRef.current = window.setTimeout(() => {
      onCloseRef.current?.();
    }, 320);
  }

  const toast = (
    <div className="pointer-events-none fixed inset-x-0 top-12 z-[99999] flex justify-center px-4">
      <div
        role="alert"
        aria-live="polite"
        className={`pointer-events-auto flex w-[calc(100%-2rem)] max-w-[520px] items-start justify-between gap-4 rounded-xl border bg-white px-4 py-3.5 shadow-[0_18px_40px_rgba(15,23,42,0.16)] ${
          isSuccess
            ? "border-emerald-100 text-emerald-800"
            : isWarning
              ? "border-amber-100 text-amber-800"
              : "border-red-100 text-red-700"
        }`}
        style={{
          opacity: isVisible && !isExiting ? 1 : 0,
          transform:
            isVisible && !isExiting
              ? "translateY(0)"
              : isExiting
                ? "translateY(-28px)"
                : "translateY(-42px)",
          transition: isExiting
            ? "opacity 320ms ease-in, transform 320ms cubic-bezier(0.4, 0, 1, 1)"
            : "opacity 420ms ease-out, transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              isSuccess
                ? "bg-emerald-100 text-emerald-700"
                : isWarning
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-600"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.9} />
          </div>

          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-semibold leading-5">
              {isSuccess
                ? "Operación realizada"
                : isWarning
                  ? "Atención"
                  : "No se pudo completar la operación"}
            </p>

            <p
              className={`mt-0.5 text-xs leading-5 ${
                isSuccess
                  ? "text-emerald-700/80"
                  : isWarning
                    ? "text-amber-700/80"
                    : "text-red-600/80"
              }`}
            >
              {feedback.message}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          aria-label="Cerrar mensaje"
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
            isSuccess
              ? "text-emerald-700/60 hover:bg-emerald-100 hover:text-emerald-800"
              : isWarning
                ? "text-amber-700/60 hover:bg-amber-100 hover:text-amber-800"
                : "text-red-700/60 hover:bg-red-100 hover:text-red-800"
          }`}
        >
          <X className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}

function FeedbackToast({ feedback, onClose }) {
  if (!feedback) {
    return null;
  }

  const feedbackKey = `${feedback.type || "info"}:${feedback.message || ""}`;

  return <VisibleFeedbackToast key={feedbackKey} feedback={feedback} onClose={onClose} />;
}

export default FeedbackToast;
