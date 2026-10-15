import { Link } from "react-router-dom";

function AccesoDenegado() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Acceso denegado</h1>
        <p className="mt-2 text-sm text-slate-500">
          No tienes permisos para acceder a esta sección.
        </p>
        <Link
          to="/inicio"
          className="mt-6 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}

export default AccesoDenegado;
