import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Crown,
  Search,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";

import FeedbackToast from "@/components/ui/FeedbackToast";
import IntegranteFormDraftBanner from "@/components/integrantes/form/IntegranteFormDraftBanner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useEquipos from "@/hooks/gestion-proyectos/useEquipos";
import useFormDraft from "@/hooks/useFormDraft";
import { getAvatarUrl } from "@/utils/avatar";

const LIST_PATH = "/gestion-proyectos/detecta/equipos";
const LEADER_CARGO = "LÍDER DE GESTIÓN DE PROYECTOS";
const MEMBER_CARGO = "MIEMBRO DE GESTIÓN DE PROYECTOS";
const DAYS = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb" };

function minutesOfDay(time = "00:00") {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours * 60) + minutes;
}

function sharedMinutes(first = [], second = []) {
  return first.reduce((total, firstBlock) => total + second.reduce((subtotal, secondBlock) => {
    if (firstBlock.dia_semana !== secondBlock.dia_semana) return subtotal;
    const start = Math.max(minutesOfDay(firstBlock.hora_inicio), minutesOfDay(secondBlock.hora_inicio));
    const end = Math.min(minutesOfDay(firstBlock.hora_fin), minutesOfDay(secondBlock.hora_fin));
    return subtotal + Math.max(0, end - start);
  }, 0), 0);
}

function scheduleSummary(schedule = []) {
  if (!schedule.length) return "Sin horario registrado";
  const days = [...new Set(schedule.map((block) => DAYS[block.dia_semana]))].join(", ");
  return `${days} · ${schedule.length} ${schedule.length === 1 ? "bloque" : "bloques"}`;
}

function overlapLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min en común`;
  return `${hours} h${rest ? ` ${rest} min` : ""} en común`;
}

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";
}

function MemberAvatar({ member, className, fallbackClassName, expandable = true }) {
  const avatarUrl = getAvatarUrl(member?.avatar_url) || getAvatarUrl(member?.avatar_path);

  if (avatarUrl) {
    return (
      <EnlargeablePhoto
        src={avatarUrl}
        fallbackSrc={getAvatarUrl(member?.avatar_path)}
        alt={`Foto de ${member?.nombre || "integrante"}`}
        className={className}
        interactive={expandable}
      />
    );
  }

  return (
    <Avatar className={className}>
      <AvatarFallback className={fallbackClassName}>{initials(member?.nombre)}</AvatarFallback>
    </Avatar>
  );
}

export default function EquipoFormPage() {
  const navigate = useNavigate();
  const { equipoId } = useParams();
  const isEditing = Boolean(equipoId);
  const draft = useFormDraft("sembria:equipo-draft");
  const { equipos, integrantes, loading, saving, error, save } = useEquipos({
    includeTeams: isEditing,
  });
  const [form, setForm] = useState({ nombre: "", lider_integrante_id: "", integrante_ids: [] });
  const [draftData, setDraftData] = useState(() => (isEditing ? null : draft.loadDraft()));
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [initializedTeamId, setInitializedTeamId] = useState(null);
  const editingTeam = useMemo(
    () => equipos.find((team) => String(team.id) === equipoId),
    [equipoId, equipos],
  );

  useEffect(() => {
    if (isEditing || draftData) return;

    const hasContent = Boolean(
      form.nombre.trim()
      || form.lider_integrante_id
      || form.integrante_ids.length,
    );

    if (hasContent) draft.saveDraft(form);
    else draft.clearDraft();
  }, [draft, draftData, form, isEditing]);

  if (editingTeam && initializedTeamId !== String(editingTeam.id)) {
    // La edición inicia con los datos recibidos del API para el equipo seleccionado.
    setInitializedTeamId(String(editingTeam.id));
    setForm({
      nombre: editingTeam.nombre,
      lider_integrante_id: String(editingTeam.lider?.id || ""),
      integrante_ids: editingTeam.integrantes.map((member) => member.id),
    });
  }

  const formReady = !isEditing
    || (editingTeam && initializedTeamId === String(editingTeam.id));

  const leader = useMemo(
    () => integrantes.find((item) => String(item.id) === form.lider_integrante_id),
    [form.lider_integrante_id, integrantes],
  );

  const leaderOptions = useMemo(() => integrantes.filter((member) => (
    member.cargo === LEADER_CARGO
    && (!member.equipo_id || member.equipo_id === editingTeam?.id)
    && !form.integrante_ids.includes(member.id)
  )), [editingTeam?.id, form.integrante_ids, integrantes]);

  const memberOptions = useMemo(
    () => integrantes.filter((member) => member.cargo === MEMBER_CARGO),
    [integrantes],
  );

  const selectedMembers = useMemo(() => form.integrante_ids
    .map((id) => integrantes.find((member) => member.id === id))
    .filter(Boolean), [form.integrante_ids, integrantes]);

  const compatibleMembers = useMemo(() => {
    if (!leader) return [];
    const term = query.trim().toLocaleLowerCase("es");

    return memberOptions
      .filter((member) => !member.equipo_id || member.equipo_id === editingTeam?.id)
      .filter((member) => member.id !== leader.id && !form.integrante_ids.includes(member.id))
      .map((member) => ({
        ...member,
        coincidencia_minutos: sharedMinutes(leader.horarios, member.horarios),
      }))
      .filter((member) => member.coincidencia_minutos > 0)
      .filter((member) => !term || `${member.nombre} ${member.cargo} ${member.area}`.toLocaleLowerCase("es").includes(term))
      .sort((first, second) => second.coincidencia_minutos - first.coincidencia_minutos
        || first.nombre.localeCompare(second.nombre, "es"));
  }, [editingTeam?.id, form.integrante_ids, leader, memberOptions, query]);

  const omittedMembers = useMemo(() => {
    if (!leader) return 0;
    return memberOptions.filter((member) => (
      (!member.equipo_id || member.equipo_id === editingTeam?.id)
      && member.id !== leader.id
      && !form.integrante_ids.includes(member.id)
      && sharedMinutes(leader.horarios, member.horarios) === 0
    )).length;
  }, [editingTeam?.id, form.integrante_ids, leader, memberOptions]);

  function selectLeader(value) {
    const nextLeader = integrantes.find((member) => String(member.id) === value);
    const retainedIds = nextLeader
      ? form.integrante_ids.filter((id) => {
        const member = integrantes.find((item) => item.id === id);
        return member && sharedMinutes(nextLeader.horarios, member.horarios) > 0;
      })
      : [];
    const removed = form.integrante_ids.length - retainedIds.length;

    setForm((current) => ({
      ...current,
      lider_integrante_id: value,
      integrante_ids: retainedIds,
    }));

    if (removed > 0) {
      setFeedback({
        type: "warning",
        message: `Se retiraron ${removed} integrante${removed === 1 ? "" : "s"} sin horario compatible con el nuevo líder.`,
      });
    }
  }

  function toggleMember(id) {
    setForm((current) => ({
      ...current,
      integrante_ids: current.integrante_ids.includes(id)
        ? current.integrante_ids.filter((memberId) => memberId !== id)
        : [...current.integrante_ids, id],
    }));
  }

  function applyDraft() {
    const leaderId = String(draftData?.lider_integrante_id || "");
    const draftLeader = integrantes.find((member) => String(member.id) === leaderId);
    const availableIds = new Set(integrantes.map((member) => Number(member.id)));
    const memberIds = Array.isArray(draftData?.integrante_ids)
      ? draftData.integrante_ids
        .map(Number)
        .filter((id) => availableIds.has(id))
        .filter((id) => {
          const member = integrantes.find((item) => Number(item.id) === id);
          return draftLeader && member && sharedMinutes(draftLeader.horarios, member.horarios) > 0;
        })
      : [];

    setForm({
      nombre: String(draftData?.nombre || ""),
      lider_integrante_id: draftLeader ? leaderId : "",
      integrante_ids: draftLeader ? memberIds : [],
    });
    setDraftData(null);
  }

  function dismissDraft() {
    setDraftData(null);
    draft.clearDraft();
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.nombre.trim() || !form.lider_integrante_id) {
      setFeedback({ type: "error", message: "Indica el nombre del equipo y selecciona un líder." });
      return;
    }

    try {
      await save({
        nombre: form.nombre.trim(),
        lider_integrante_id: Number(form.lider_integrante_id),
        integrante_ids: form.integrante_ids,
      }, editingTeam?.id);
      if (!isEditing) draft.clearDraft();
      navigate(LIST_PATH, {
        state: {
          feedback: {
            type: "success",
            message: isEditing ? "Equipo actualizado correctamente." : "Equipo creado correctamente.",
          },
        },
      });
    } catch (requestError) {
      setFeedback({
        type: "error",
        message: requestError.message || `No se pudo ${isEditing ? "actualizar" : "crear"} el equipo.`,
      });
    }
  }

  return (
    <div className="module-page-enter mx-auto max-w-6xl pb-10">
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />

      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(LIST_PATH)}
          disabled={saving}
          className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Volver a equipos
        </button>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-[#2D5A3D]" />
          <div className="p-6">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
                <UsersRound className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1.5 text-xs font-bold tracking-[0.12em] text-emerald-700 uppercase">Equipos</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isEditing ? "Editar equipo" : "Registrar nuevo equipo"}</h1>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {isEditing
                    ? "Actualiza los datos y selecciona integrantes con horario compatible."
                    : "Define al líder y forma un equipo con integrantes que compartan horarios."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(error || (isEditing && !loading && !editingTeam)) && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error || "No se encontró el equipo solicitado."}
        </div>
      )}

      {!isEditing && !loading && draftData && (
        <div className="mb-5">
          <IntegranteFormDraftBanner onContinue={applyDraft} onDismiss={dismissDraft} />
        </div>
      )}

      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-[#2D5A3D]" />
          <div className="p-10 text-center">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[#2D5A3D]" />
            <p className="text-sm font-semibold text-slate-700">Preparando el equipo</p>
            <p className="mt-1 text-xs text-slate-400">Cargando integrantes y horarios disponibles...</p>
          </div>
        </div>
      ) : formReady ? (
        <form onSubmit={submit} className="grid items-stretch gap-5 lg:grid-cols-2">
          <section className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2D5A3D] text-xs font-bold text-white">1</span>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Datos básicos</h2>
                  <p className="text-xs text-slate-500">Identifica el equipo y selecciona a su responsable.</p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <label className="block text-sm font-semibold text-slate-700">
                Nombre del equipo
                <Input
                  value={form.nombre}
                  onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
                  className="mt-2 border-slate-300 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                  placeholder="Ej. Alianzas internacionales"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Líder del equipo
                <select
                  value={form.lider_integrante_id}
                  onChange={(event) => selectLeader(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Selecciona un líder</option>
                  {leaderOptions.map((member) => (
                    <option key={member.id} value={member.id}>{member.nombre} · {scheduleSummary(member.horarios)}</option>
                  ))}
                </select>
              </label>

              {leader && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5">
                  <div className="relative shrink-0">
                    <MemberAvatar member={leader} className="h-10 w-10 border border-emerald-200 bg-white" fallbackClassName="bg-white text-xs font-bold text-emerald-700" />
                    <span className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-2 ring-emerald-50"><Crown className="h-2.5 w-2.5" /></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{leader.nombre}</p>
                    <p className="truncate text-xs text-slate-500">{leader.cargo || "Sin cargo"} · {leader.area || "Sin área"}</p>
                  </div>
                  <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-emerald-700 sm:flex"><Clock3 className="h-3.5 w-3.5" />{scheduleSummary(leader.horarios)}</span>
                </div>
              )}
            </div>
          </section>

          <section className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2D5A3D] text-xs font-bold text-white">2</span>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Integrantes</h2>
                  <p className="text-xs text-slate-500">Recomendados por mayor coincidencia horaria.</p>
                </div>
              </div>
              <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{selectedMembers.length} elegidos</span>
            </div>

            <div className="p-5 sm:p-6">
              {selectedMembers.length > 0 && (
                <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5">
                  <p className="mb-2.5 text-[10px] font-bold tracking-wider text-emerald-700 uppercase">Equipo seleccionado</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map((member) => (
                      <span key={member.id} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white py-1 pr-1 pl-1 text-xs font-medium text-slate-700">
                        <MemberAvatar member={member} className="h-6 w-6" fallbackClassName="bg-emerald-50 text-[9px] font-bold text-emerald-700" />
                        {member.nombre}
                        <button type="button" onClick={() => toggleMember(member.id)} className="rounded-full p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Quitar a ${member.nombre}`}><X className="h-3.5 w-3.5" /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!leader ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
                  <Crown className="mx-auto h-6 w-6 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-600">Selecciona primero al líder</p>
                  <p className="mt-1 text-xs text-slate-400">Luego aparecerán únicamente los integrantes con horarios compatibles.</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                    <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar integrante compatible" className="border-slate-300 bg-white pl-9 focus-visible:ring-emerald-500/20" />
                  </div>
                  <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
                    {compatibleMembers.map((member, index) => (
                      <button type="button" key={member.id} onClick={() => toggleMember(member.id)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40">
                        <MemberAvatar member={member} className="h-10 w-10 border border-emerald-100" fallbackClassName="bg-emerald-50 text-xs font-bold text-emerald-700" expandable={false} />
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-700">{member.nombre}</span><span className="block truncate text-xs text-slate-400">{member.cargo || "Sin cargo"} · {scheduleSummary(member.horarios)}</span></span>
                        <span className="shrink-0 text-right"><span className="flex items-center justify-end gap-1 text-xs font-bold text-emerald-700">{index === 0 && <Sparkles className="h-3.5 w-3.5" />}{overlapLabel(member.coincidencia_minutos)}</span><span className="text-[11px] text-slate-400">Seleccionar</span></span>
                      </button>
                    ))}
                    {compatibleMembers.length === 0 && <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-8 text-center text-sm text-slate-500">No hay más integrantes compatibles{query ? " para esta búsqueda" : " con este líder"}.</div>}
                  </div>
                  {omittedMembers > 0 && <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5" /> {omittedMembers} {omittedMembers === 1 ? "persona no se muestra" : "personas no se muestran"} porque no comparte horario con el líder.</p>}
                </>
              )}
            </div>
          </section>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row lg:col-span-2">
            <Button type="button" variant="outline" onClick={() => navigate(LIST_PATH)} disabled={saving} className="rounded-xl border-slate-300">Cancelar</Button>
            <Button type="submit" disabled={saving} className="gap-2 rounded-xl bg-[#2D5A3D] px-5 text-white! hover:bg-[#244b33] hover:text-white!" style={{ color: "#ffffff" }}><CheckCircle2 className="h-4 w-4" color="#ffffff" />{saving ? (isEditing ? "Guardando cambios..." : "Creando equipo...") : (isEditing ? "Guardar cambios" : "Crear equipo")}</Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
