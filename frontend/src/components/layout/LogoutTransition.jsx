import logoSembria from "@/assets/logo_sembria.webp";

function LogoutTransition({ visible }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={`fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,#ecfdf5_0%,#f8fafc_46%,#eef7f1_100%)] px-5 transition-opacity duration-500 ${
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
    >
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 -bottom-40 h-[28rem] w-[28rem] rounded-full bg-lime-100/40 blur-3xl"
      />

      {/* Main content */}
      <div
        className={`relative flex w-full max-w-md flex-col items-center text-center transition-all duration-700 ease-out ${
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-5 opacity-0"
        }`}
      >
        {/* Logo */}
        <div className="flex h-24 items-center justify-center">
          <img
            src={logoSembria}
            alt="Sembria"
            className={`h-20 w-auto max-w-[240px] object-contain transition-all duration-700 ${
              visible
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-2 scale-95 opacity-0"
            }`}
          />
        </div>

        {/* Message */}
        <h2 className="mt-7 text-xl font-semibold tracking-tight text-slate-900">
          Cerrando sesión
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Protegiendo tu cuenta antes de salir.
        </p>

        {/* Loading dots */}
        <div
          aria-hidden="true"
          className="mt-7 flex items-center gap-2"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#2D5A3D] motion-safe:animate-pulse" />

          <span
            className="h-1.5 w-1.5 rounded-full bg-[#2D5A3D] motion-safe:animate-pulse"
            style={{ animationDelay: "180ms" }}
          />

          <span
            className="h-1.5 w-1.5 rounded-full bg-[#2D5A3D] motion-safe:animate-pulse"
            style={{ animationDelay: "360ms" }}
          />
        </div>

        {/* Security status */}
        <p className="mt-6 text-[10px] font-medium tracking-[0.18em] text-emerald-700/60 uppercase">
          Sesión segura
        </p>
      </div>
    </div>
  );
}

export default LogoutTransition;
