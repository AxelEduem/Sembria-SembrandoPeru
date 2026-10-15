import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  GraduationCap,
  History,
  Lightbulb,
  LoaderCircle,
  Rocket,
  Search,
  SearchCheck,
  Sparkles,
  Trophy,
  UsersRound,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useCapacitaciones from "@/hooks/gestion-proyectos/useCapacitaciones";

const STAGE_ICONS = [BookOpenCheck, SearchCheck, Rocket];
const STATUS = {
  sin_iniciar: { label: "Pendiente de iniciar", className: "border-amber-200 bg-amber-50 text-amber-700" },
  en_capacitacion: { label: "En capacitación", className: "border-blue-200 bg-blue-50 text-blue-700" },
  completada: { label: "Completada", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatDate(value, withTime = false) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

function progressFor(item) {
  const completed = item.etapas.filter((stage) => stage.completada).length;
  return Math.round((completed / item.etapas.length) * 100);
}

function StageJourney({ item, compact = false }) {
  return (
    <ol className={`grid gap-3 ${compact ? "sm:grid-cols-3" : "lg:grid-cols-3"}`}>
      {item.etapas.map((stage, index) => {
        const Icon = STAGE_ICONS[index];
        const isCurrent = item.etapa_actual === stage.numero;
        return (
          <li
            key={stage.numero}
            aria-current={isCurrent ? "step" : undefined}
            className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
              stage.completada
                ? "border-emerald-200 bg-emerald-50/70"
                : isCurrent
                  ? "border-[#2D5A3D]/30 bg-white shadow-[0_10px_30px_rgba(45,90,61,0.12)] ring-1 ring-[#2D5A3D]/10"
                  : "border-slate-200 bg-slate-50/70"
            }`}
          >
            {isCurrent && <span className="absolute inset-x-0 top-0 h-1 bg-[#2D5A3D]" />}
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                stage.completada ? "bg-emerald-600 text-white" : isCurrent ? "bg-[#2D5A3D] text-white" : "bg-white text-slate-400"
              }`}>
                {stage.completada ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Fase {stage.numero}</p>
                <p className="mt-1 text-sm font-semibold leading-snug text-slate-800">{stage.nombre}</p>
                <p className={`mt-2 text-xs font-medium ${stage.completada ? "text-emerald-700" : isCurrent ? "text-[#2D5A3D]" : "text-slate-400"}`}>
                  {stage.completada ? `Finalizada · ${formatDate(stage.completada_at)}` : isCurrent ? "Tu etapa actual" : "Próximamente"}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function MemberCompletion({ item }) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-[#21452f] via-[#2D5A3D] to-emerald-700 px-6 py-10 text-white shadow-[0_20px_60px_rgba(45,90,61,0.24)] sm:px-10">
        <Sparkles className="absolute left-8 top-8 h-7 w-7 text-amber-300/80" />
        <Sparkles className="absolute bottom-10 right-10 h-5 w-5 text-emerald-200/80" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-emerald-300/10" />
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-300 text-amber-950 shadow-lg shadow-emerald-950/20">
            <Trophy className="h-10 w-10" />
          </div>
          <Badge className="mt-6 border-white/20 bg-white/10 text-white">Ruta completada</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">¡Felicitaciones, {item.nombre.split(" ")[0]}!</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-emerald-50 sm:text-base">
            Terminaste las tres fases de capacitación y ya cuentas con la preparación necesaria para registrar proyectos en el sistema.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/10 px-4 py-2 text-sm text-emerald-50">
            <Clock3 className="h-4 w-4" />
            Este reconocimiento estará visible hasta {formatDate(item.celebracion_hasta, true)}.
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div>
          <div>
            <h2 className="font-bold text-slate-900">Tu recorrido completado</h2>
            <p className="text-sm text-slate-500">Finalizaste el {formatDate(item.completada_at, true)}.</p>
          </div>
        </div>
        <StageJourney item={item} />
      </section>
    </div>
  );
}

function MemberProgress({ item }) {
  const progress = progressFor(item);
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#244b33] to-[#3d7551] px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Mi capacitación</p>
              <h1 className="mt-2 text-2xl font-bold">Hola, {item.nombre.split(" ")[0]}</h1>
              <p className="mt-1 text-sm text-emerald-50/90">Avanza a tu ritmo. Cada fase te acerca a la gestión de proyectos.</p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15 backdrop-blur-sm">
              <div className="text-right"><p className="text-2xl font-bold">{progress}%</p><p className="text-xs text-emerald-100">completado</p></div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15"><GraduationCap className="h-7 w-7" /></div>
            </div>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-black/15">
            <div className="h-full rounded-full bg-amber-300 transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700"><Lightbulb className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ahora estás en</p>
              <p className="mt-1 font-semibold text-slate-900">Fase {item.etapa_actual}: {item.etapa_actual_nombre}</p>
              <p className="mt-1 text-sm text-slate-500">Tu coordinación marcará esta fase cuando hayas completado la formación.</p>
            </div>
          </div>
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">En progreso</Badge>
        </div>
      </section>

      <section>
        <div className="mb-4"><h2 className="text-lg font-bold text-slate-900">Tu ruta de aprendizaje</h2><p className="text-sm text-slate-500">Consulta lo que ya lograste y cuál es tu siguiente paso.</p></div>
        <StageJourney item={item} />
      </section>
    </div>
  );
}

function AdminTrainingCard({ item, updating, onComplete }) {
  const status = STATUS[item.estado] || STATUS.sin_iniciar;
  const progress = progressFor(item);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg" className="ring-2 ring-emerald-100"><AvatarFallback className="bg-emerald-50 font-bold text-emerald-700">{initials(item.nombre)}</AvatarFallback></Avatar>
          <div className="min-w-0"><h2 className="truncate font-semibold text-slate-900">{item.nombre}</h2><p className="truncate text-sm text-slate-500">{item.correo || item.cargo}</p></div>
        </div>
        <Badge variant="outline" className={status.className}>{status.label}</Badge>
      </div>
      <div className="mt-5 flex items-center justify-between text-xs font-medium text-slate-500"><span>{item.etapa_actual ? `Fase ${item.etapa_actual} de 3` : "3 de 3 fases"}</span><span>{progress}%</span></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#2D5A3D] transition-all" style={{ width: `${progress}%` }} /></div>
      <div className="mt-5 space-y-2">
        {item.etapas.map((stage) => {
          const isCurrent = item.etapa_actual === stage.numero;
          return (
            <div key={stage.numero} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${isCurrent ? "border-emerald-200 bg-emerald-50/70" : "border-slate-100"}`}>
              {stage.completada ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <Circle className={`h-5 w-5 shrink-0 ${isCurrent ? "text-emerald-600" : "text-slate-300"}`} />}
              <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fase {stage.numero}</p><p className="truncate text-sm font-medium text-slate-700">{stage.nombre}</p></div>
              {isCurrent && <Button type="button" size="sm" disabled={updating} onClick={() => onComplete(item.integrante_id, stage.numero)}>{updating && <LoaderCircle className="animate-spin" />}Marcar lista</Button>}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function HistoryCard({ item }) {
  return (
    <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg"><AvatarFallback className="bg-emerald-600 font-bold text-white">{initials(item.nombre)}</AvatarFallback></Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{item.nombre}</h2><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700"><Trophy /> Graduado</Badge></div>
            <p className="mt-1 text-sm text-slate-500">{item.correo || item.cargo}</p>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-2 text-left sm:text-right"><p className="text-xs font-medium text-slate-400">Finalizó la capacitación</p><p className="mt-0.5 text-sm font-semibold text-slate-700">{formatDate(item.completada_at, true)}</p></div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {item.etapas.map((stage) => <div key={stage.numero} className="flex items-center gap-2 rounded-xl bg-emerald-50/70 px-3 py-2 text-xs font-medium text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0" /><span className="truncate">{stage.nombre}</span></div>)}
      </div>
    </article>
  );
}

function EmptyState({ history, searching }) {
  const Icon = history ? History : GraduationCap;
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <Icon className="mx-auto h-9 w-9 text-slate-300" />
      <p className="mt-3 font-medium text-slate-700">{searching ? "No hay integrantes que coincidan con la búsqueda." : history ? "Aún no hay capacitaciones completadas." : "No hay miembros en capacitación."}</p>
    </div>
  );
}

export default function CapacitacionPage() {
  const { items, canManage, loading, updatingId, error, reload, completeStage } = useCapacitaciones();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("en_curso");
  const filteredItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    if (!term) return items;
    return items.filter((item) => `${item.nombre} ${item.correo || ""}`.toLocaleLowerCase("es").includes(term));
  }, [items, search]);
  const activeItems = filteredItems.filter((item) => item.estado !== "completada");
  const completedItems = filteredItems.filter((item) => item.estado === "completada");
  const inProgressCount = items.filter((item) => item.estado === "en_capacitacion").length;
  const completedCount = items.filter((item) => item.estado === "completada").length;
  const memberItem = items[0];

  async function handleComplete(integranteId, stage) {
    const updated = await completeStage(integranteId, stage);
    if (updated?.estado === "completada") setTab("historial");
  }

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center text-slate-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Cargando capacitación...</div>;

  if (!canManage && memberItem) {
    return <div className="mx-auto w-full max-w-6xl pb-10">{memberItem.estado === "completada" && memberItem.mostrar_celebracion ? <MemberCompletion item={memberItem} /> : <MemberProgress item={memberItem} />}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-[#2D5A3D] p-3 text-white shadow-lg shadow-emerald-900/15"><GraduationCap className="h-7 w-7" /></div>
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Gestión de Proyectos</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Capacitación del equipo</h1><p className="mt-1 max-w-2xl text-sm text-slate-600">Acompaña el avance de cada miembro y consulta por separado a quienes ya completaron su formación.</p></div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Miembros registrados", value: items.length, icon: UsersRound, tone: "bg-slate-100 text-slate-700" },
          { label: "En capacitación", value: inProgressCount, icon: BookOpenCheck, tone: "bg-blue-100 text-blue-700" },
          { label: "Capacitaciones terminadas", value: completedCount, icon: Trophy, tone: "bg-emerald-100 text-emerald-700" },
        ].map(({ label, value, icon: Icon, tone }) => <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className={`rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-slate-900">{value}</p><p className="text-xs font-medium text-slate-500">{label}</p></div></div>)}
      </div>

      {error && <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><Button type="button" size="sm" variant="outline" onClick={reload}>Reintentar</Button></div>}

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-11 rounded-xl bg-slate-100 p-1">
            <TabsTrigger value="en_curso" className="rounded-lg px-4"><BookOpenCheck /> En curso <span className="rounded-full bg-white px-1.5 text-xs">{activeItems.length}</span></TabsTrigger>
            <TabsTrigger value="historial" className="rounded-lg px-4"><History /> Historial <span className="rounded-full bg-white px-1.5 text-xs">{completedItems.length}</span></TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar integrante..." className="pl-9" aria-label="Buscar integrante" /></div>
        </div>
        <TabsContent value="en_curso" className="mt-4">
          {activeItems.length ? <div className="grid gap-4 lg:grid-cols-2">{activeItems.map((item) => <AdminTrainingCard key={item.integrante_id} item={item} updating={updatingId === item.integrante_id} onComplete={handleComplete} />)}</div> : <EmptyState searching={Boolean(search)} />}
        </TabsContent>
        <TabsContent value="historial" className="mt-4">
          {completedItems.length ? <div className="space-y-3">{completedItems.map((item) => <HistoryCard key={item.integrante_id} item={item} />)}</div> : <EmptyState history searching={Boolean(search)} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
