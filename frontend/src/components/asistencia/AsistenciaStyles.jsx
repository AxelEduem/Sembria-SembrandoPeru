function AsistenciaStyles() {
  return (
    <style>{`
      @keyframes asistencia-section-enter {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes asistencia-card-enter {
        from {
          opacity: 0;
          transform: translateY(10px) scale(0.99);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes asistencia-pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.55;
          transform: scale(1.18);
        }
      }

      @keyframes asistencia-active-glow {
        0%, 100% {
          box-shadow: 0 8px 30px rgba(45, 90, 61, 0.08);
        }
        50% {
          box-shadow: 0 12px 38px rgba(45, 90, 61, 0.15);
        }
      }

      @keyframes asistencia-shimmer {
        0% {
          background-position: -450px 0;
        }
        100% {
          background-position: 450px 0;
        }
      }

      .asistencia-section-enter {
        animation: asistencia-section-enter 500ms
          cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .asistencia-card-enter {
        opacity: 0;
        animation: asistencia-card-enter 450ms
          cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }

      .asistencia-active-card {
  opacity: 1;
  animation: asistencia-active-glow 2.8s ease-in-out infinite;
}

      .asistencia-live-dot {
        animation: asistencia-pulse 1.7s ease-in-out infinite;
      }

      .asistencia-skeleton {
        background: linear-gradient(
          90deg,
          rgba(241, 245, 249, 1) 25%,
          rgba(248, 250, 252, 1) 50%,
          rgba(241, 245, 249, 1) 75%
        );
        background-size: 900px 100%;
        animation: asistencia-shimmer 1.5s linear infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .asistencia-section-enter,
        .asistencia-card-enter,
        .asistencia-active-card,
        .asistencia-live-dot,
        .asistencia-skeleton {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default AsistenciaStyles;