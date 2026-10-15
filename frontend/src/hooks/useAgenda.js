import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  cancelAgendaMeeting,
  createAgendaMeeting,
  getAgendaCurrentPerson,
  getAgendaMeetings,
  getAgendaPeople,
  respondAgendaInvitation,
} from "@/services/agenda/agendaService";

function accountKey(profile) {
  const id = profile?.cuenta_acceso_id || profile?.id;
  return id ? String(id) : null;
}

function mergePeople(currentPerson, directory = []) {
  if (!currentPerson) return directory;

  return [
    currentPerson,
    ...directory.filter((person) => String(person.id) !== String(currentPerson.id)),
  ];
}

async function loadAgendaShared(key, { force = false } = {}) {
  if (!key) return { meetings: [], currentPerson: null };

  const [meetings, currentPerson] = await Promise.all([
    getAgendaMeetings({ force, cacheScope: key }),
    getAgendaCurrentPerson({ force, cacheScope: key }),
  ]);

  return { meetings, currentPerson, updatedAt: Date.now() };
}

async function loadPeopleShared(key, { force = false } = {}) {
  if (!key) return [];
  return getAgendaPeople({ force, cacheScope: key });
}

export function useAgenda() {
  const { profile } = useAuth();
  const key = accountKey(profile);
  const [people, setPeople] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(Boolean(key));
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const currentPersonRef = useRef(null);
  const directoryRef = useRef([]);

  const applySnapshot = useCallback(
    (snapshot) => {
      const currentPerson = snapshot?.currentPerson || null;

      currentPersonRef.current = currentPerson;
      setMeetings(snapshot?.meetings || []);
      setPeople(mergePeople(currentPerson, directoryRef.current));
    },
    [],
  );

  const refresh = useCallback(async () => {
    if (!key) return false;

    setLoading(true);
    setError("");
    try {
      const snapshot = await loadAgendaShared(key, { force: true });
      applySnapshot(snapshot);
      return true;
    } catch (requestError) {
      setError(requestError.message || "No se pudo cargar la agenda.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [applySnapshot, key]);

  const searchPeople = useCallback(
    async (term) => {
      if (!key || !String(term || "").trim()) return [];

      setPeopleLoading(true);
      try {
        const directory = await loadPeopleShared(key);
        directoryRef.current = directory;
        setPeople(mergePeople(currentPersonRef.current, directory));
        return directory;
      } catch (requestError) {
        setError(requestError.message || "No se pudo buscar personas.");
        return [];
      } finally {
        setPeopleLoading(false);
      }
    },
    [key],
  );

  useEffect(() => {
    let active = true;

    if (!key) {
      currentPersonRef.current = null;
      directoryRef.current = [];
      Promise.resolve().then(() => {
        if (!active) return;
        setPeople([]);
        setMeetings([]);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    currentPersonRef.current = null;
    directoryRef.current = [];
    Promise.resolve().then(() => {
      if (!active) return;
      setPeople([]);
      setMeetings([]);
      setLoading(true);
      setError("");
    });

    loadAgendaShared(key)
      .then((snapshot) => {
        if (active) applySnapshot(snapshot);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "No se pudo cargar la agenda.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const backgroundRefresh = window.setInterval(() => {
      loadAgendaShared(key, { force: true })
        .then((snapshot) => {
          if (active) applySnapshot(snapshot);
        })
        .catch(() => {
          // La siguiente sincronización o una recarga manual volverá a intentarlo.
        });
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(backgroundRefresh);
    };
  }, [applySnapshot, key]);

  const execute = useCallback(
    async (action, successMessage) => {
      setSaving(true);
      setError("");
      setFeedback(null);
      try {
        await action();
        const snapshot = await loadAgendaShared(key, { force: true });
        applySnapshot(snapshot);
        setFeedback({ type: "success", message: successMessage });
        return true;
      } catch (requestError) {
        const message = requestError.message || "No se pudo completar la acción.";
        setFeedback({ type: "error", message });
        return message;
      } finally {
        setSaving(false);
      }
    },
    [applySnapshot, key],
  );

  const pendingInvitations = useMemo(
    () =>
      meetings.filter(
        (item) => !item.soy_organizador && item.estado === "pendiente",
      ),
    [meetings],
  );
  const sentMeetings = useMemo(
    () => meetings.filter((item) => item.soy_organizador && item.estado === "pendiente"),
    [meetings],
  );
  const confirmedMeetings = useMemo(
    () => meetings.filter((item) => item.estado === "confirmada"),
    [meetings],
  );

  return {
    people,
    meetings,
    pendingInvitations,
    sentMeetings,
    confirmedMeetings,
    loading,
    peopleLoading,
    saving,
    error,
    feedback,
    clearFeedback: () => setFeedback(null),
    refresh,
    searchPeople,
    createMeeting: (values) =>
      execute(() => createAgendaMeeting(values), "La solicitud de reunión fue enviada."),
    respondInvitation: (id, response) =>
      execute(
        () => respondAgendaInvitation(id, response),
        response === "aceptada" ? "Invitación aceptada." : "Invitación rechazada.",
      ),
    cancelMeeting: (id) => execute(() => cancelAgendaMeeting(id), "La reunión fue cancelada."),
  };
}
