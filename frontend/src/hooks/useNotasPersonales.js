import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  createNotaPersonal,
  deleteNotaPersonal,
  getNotasPersonales,
  updateNotaPersonal,
} from "@/services/agenda/notasService";

function accountKey(profile) {
  return profile?.cuenta_acceso_id || profile?.id || null;
}

function sortNotes(notes) {
  return [...notes].sort((first, second) => {
    if (first.fijada !== second.fijada) return first.fijada ? -1 : 1;
    return new Date(second.updated_at).getTime() - new Date(first.updated_at).getTime();
  });
}

export function useNotasPersonales() {
  const { profile } = useAuth();
  const key = accountKey(profile);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(Boolean(key));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);

  const refresh = useCallback(async () => {
    if (!key) return false;
    setLoading(true);
    setError("");
    try {
      setNotes(sortNotes(await getNotasPersonales({ force: true, cacheScope: key })));
      return true;
    } catch (requestError) {
      setError(requestError.message || "No se pudieron cargar tus notas.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    let active = true;

    if (!key) {
      Promise.resolve().then(() => {
        if (!active) return;
        setNotes([]);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    getNotasPersonales({ cacheScope: key })
      .then((rows) => {
        if (active) setNotes(sortNotes(rows));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "No se pudieron cargar tus notas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [key]);

  const save = useCallback(async (values, noteId = null) => {
    setSaving(true);
    setFeedback(null);
    try {
      const saved = noteId
        ? await updateNotaPersonal(noteId, values)
        : await createNotaPersonal(values);
      setNotes((current) => sortNotes(
        noteId
          ? current.map((note) => (note.id === saved.id ? saved : note))
          : [saved, ...current],
      ));
      setFeedback({ type: "success", message: noteId ? "Nota actualizada." : "Nota guardada." });
      return saved;
    } catch (requestError) {
      setFeedback({ type: "error", message: requestError.message || "No se pudo guardar la nota." });
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const remove = useCallback(async (noteId) => {
    setSaving(true);
    setFeedback(null);
    try {
      await deleteNotaPersonal(noteId);
      setNotes((current) => current.filter((note) => note.id !== noteId));
      setFeedback({ type: "success", message: "Nota eliminada." });
      return true;
    } catch (requestError) {
      setFeedback({ type: "error", message: requestError.message || "No se pudo eliminar la nota." });
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    notes,
    loading,
    saving,
    error,
    feedback,
    clearFeedback: () => setFeedback(null),
    refresh,
    save,
    remove,
  };
}
