import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  addTareaNote,
  createTarea,
  getTareaIntegrantes,
  getTareas,
  updateTarea,
  updateTareaStatus,
} from "@/services/tareas/tareasService";

function accountKey(profile) {
  return profile?.cuenta_acceso_id || profile?.id || null;
}

export function useTareas() {
  const { profile } = useAuth();
  const key = accountKey(profile);
  const [tasks, setTasks] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(Boolean(key));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);

  const refresh = useCallback(async ({ quiet = false, force = true } = {}) => {
    if (!key) return false;
    if (!quiet) setLoading(true);
    setError("");

    try {
      const [taskRows, peopleRows] = await Promise.all([
        getTareas({ force, cacheScope: key }),
        getTareaIntegrantes({ force, cacheScope: key }),
      ]);
      setTasks(taskRows);
      setPeople(peopleRows);
      return true;
    } catch (requestError) {
      setError(requestError.message || "No se pudieron cargar las tareas.");
      return false;
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    let active = true;

    if (!key) {
      Promise.resolve().then(() => {
        if (!active) return;
        setTasks([]);
        setPeople([]);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    Promise.all([
      getTareas({ cacheScope: key }),
      getTareaIntegrantes({ cacheScope: key }),
    ])
      .then(([taskRows, peopleRows]) => {
        if (!active) return;
        setTasks(taskRows);
        setPeople(peopleRows);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "No se pudieron cargar las tareas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [key]);

  const execute = useCallback(async (action, successMessage) => {
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await action();
      setTasks((current) => {
        const exists = current.some((task) => task.id === updated.id);
        return exists
          ? current.map((task) => (task.id === updated.id ? updated : task))
          : [updated, ...current];
      });
      setFeedback({ type: "success", message: successMessage });
      return updated;
    } catch (requestError) {
      const message = requestError.message || "No se pudo completar la acción.";
      setFeedback({ type: "error", message });
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    tasks,
    people,
    loading,
    saving,
    error,
    feedback,
    clearFeedback: () => setFeedback(null),
    refresh,
    createTask: (values) => execute(() => createTarea(values), "La tarea fue asignada."),
    updateTask: (taskId, values) =>
      execute(() => updateTarea(taskId, values), "La tarea fue actualizada."),
    changeStatus: (taskId, status) =>
      execute(
        () => updateTareaStatus(taskId, status),
        status === "completada" ? "La tarea fue completada." : "El estado fue actualizado.",
      ),
    addNote: (taskId, content) =>
      execute(() => addTareaNote(taskId, content), "La nota fue agregada."),
  };
}
