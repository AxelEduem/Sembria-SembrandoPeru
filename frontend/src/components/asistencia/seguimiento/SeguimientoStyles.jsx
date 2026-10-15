function SeguimientoStyles() {
  return (
    <style>{`
      @keyframes seguimiento-section-enter {
        from {
          opacity: 0;
          transform: translateY(8px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes seguimiento-card-enter {
        from {
          opacity: 0;
          transform: translateY(6px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes seguimiento-pulse {
        0%,
        100% {
          opacity: 1;
        }

        50% {
          opacity: 0.45;
        }
      }

      @keyframes seguimiento-shimmer {
        0% {
          background-position: -600px 0;
        }

        100% {
          background-position: 600px 0;
        }
      }

      .seguimiento-section-enter {
        animation: seguimiento-section-enter 420ms ease-out both;
      }

      .seguimiento-card-enter {
        animation: seguimiento-card-enter 420ms ease-out both;
      }

      .seguimiento-live-dot {
        animation: seguimiento-pulse 1.8s ease-in-out infinite;
      }

      .seguimiento-skeleton {
        background:
          linear-gradient(
            90deg,
            rgba(241, 245, 249, 0.95) 0%,
            rgba(248, 250, 252, 1) 45%,
            rgba(241, 245, 249, 0.95) 100%
          );
        background-size: 1200px 100%;
        animation: seguimiento-shimmer 1.5s linear infinite;
      }

      .seguimiento-scrollbar::-webkit-scrollbar {
        width: 7px;
        height: 7px;
      }

      .seguimiento-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }

      .seguimiento-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.35);
        border-radius: 999px;
      }

      .seguimiento-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(148, 163, 184, 0.55);
      }

      @media (prefers-reduced-motion: reduce) {
        .seguimiento-section-enter,
        .seguimiento-card-enter,
        .seguimiento-live-dot,
        .seguimiento-skeleton {
          animation: none !important;
        }
      }
    `}</style>
  );
}

export default SeguimientoStyles;