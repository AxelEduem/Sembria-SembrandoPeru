import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getCurrentUser,
  getPermissionsVersion,
  loginRequest,
  logoutRequest,
} from "../services/authService.js";
import LoginTransition from "../components/layout/LoginTransition.jsx";
import LogoutTransition from "../components/layout/LogoutTransition.jsx";

const AuthContext = createContext(null);

const wait = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function getAuthErrorMessage(error) {
  if (!error) {
    return "No se pudo iniciar sesión.";
  }

  const status = error?.status;
  const code = error?.data?.code;
  const message =
    typeof error?.message === "string"
      ? error.message.trim()
      : "";

  if (status === 401) {
    return "El correo o la contraseña son incorrectos.";
  }

  if (code === "TEMPORARY_PASSWORD_EXPIRED") {
    return (
      "Tu contraseña temporal ha expirado. " +
      "Solicita nuevas credenciales a tu administrador."
    );
  }

  if (code === "ACCOUNT_CONFIGURATION_ERROR") {
    return (
      "Tu cuenta no está configurada correctamente. " +
      "Contacta al administrador."
    );
  }

  if (status === 403) {
    return (
      message ||
      "No tienes autorización para acceder al sistema."
    );
  }

  if (status === 422) {
    return (
      message ||
      "Los datos proporcionados no son válidos."
    );
  }

  if (status >= 500) {
    return (
      "El servidor presentó un problema. " +
      "Inténtalo nuevamente."
    );
  }

  return (
    message ||
    "No se pudo iniciar sesión. " +
    "Verifica tus credenciales e inténtalo nuevamente."
  );
}

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name || "",
    email: user.email || "",
  };
}

function normalizeProfile(profile) {
  if (!profile) {
    return null;
  }

  return {
    ...profile,

    id: profile.id ?? null,
    cuenta_acceso_id:
      profile.cuenta_acceso_id ??
      profile.id ??
      null,

    user_id:
      profile.user_id ??
      null,

    auth_user_id:
      profile.auth_user_id ??
      profile.user_id ??
      null,

    persona_id:
      profile.persona_id ??
      profile.persona?.id ??
      null,

    nombres:
      profile.nombres ??
      profile.persona?.nombres ??
      "",

    apellidos:
      profile.apellidos ??
      profile.persona?.apellidos ??
      "",

    correo:
      profile.correo ??
      profile.persona?.correo ??
      "",

    activo:
      profile.activo !== false,

    must_change_password:
      profile.must_change_password === true,

    avatar_path:
      profile.avatar_path ??
      profile.integrante?.avatar_path ??
      null,

    avatar_url:
      profile.avatar_url ??
      profile.integrante?.avatar_url ??
      null,

    cargo_id:
      profile.cargo_id ??
      profile.cargo?.id ??
      null,

    role_id:
      profile.role_id ??
      profile.role?.id ??
      null,

    rol:
      profile.rol ??
      profile.role?.codigo ??
      null,

    role_code:
      profile.role_code ??
      profile.role?.codigo ??
      null,

    acceso_total:
      profile.acceso_total === true ||
      profile.role?.acceso_total === true,

    permissions:
      Array.isArray(profile.permissions)
        ? profile.permissions
        : [],

    areas:
      profile.areas ??
      profile.area ??
      null,

    periodo:
      profile.periodo ??
      profile.historial ??
      null,

    tipo_integrante:
      profile.tipo_integrante ??
      profile.historial?.tipo_integrante ??
      null,
  };
}

function validateProfile(profile) {
  if (!profile) {
    return {
      allowed: false,
      message:
        "La cuenta no está configurada correctamente en el sistema.",
    };
  }

  if (profile.activo !== true) {
    return {
      allowed: false,
      message:
        "Tu cuenta está desactivada. Contacta al administrador.",
    };
  }

  if (!profile.persona) {
    return {
      allowed: false,
      message:
        "Tu cuenta no tiene una persona institucional asociada.",
    };
  }

  if (!profile.integrante) {
    return {
      allowed: false,
      message:
        "Tu cuenta no tiene un integrante asociado.",
    };
  }

  if (!profile.periodo) {
    return {
      allowed: false,
      message:
        "Tu integrante no tiene un periodo activo.",
    };
  }

  if (!profile.cargo) {
    return {
      allowed: false,
      message:
        "Tu usuario no tiene un cargo configurado. " +
        "Contacta al administrador.",
    };
  }

  if (profile.cargo.activo !== true) {
    return {
      allowed: false,
      message:
        "El cargo asociado a tu usuario está inactivo. " +
        "Contacta al administrador.",
    };
  }

  if (!profile.area) {
    return {
      allowed: false,
      message:
        "Tu cargo no tiene un área configurada. " +
        "Contacta al administrador.",
    };
  }

  if (!profile.role) {
    return {
      allowed: false,
      message:
        "Tu usuario no tiene un rol configurado. " +
        "Contacta al administrador.",
    };
  }

  if (profile.role.activo !== true) {
    return {
      allowed: false,
      message:
        "El rol asociado a tu usuario está inactivo. " +
        "Contacta al administrador.",
    };
  }

  return {
    allowed: true,
    message: "",
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginTransitionName, setLoginTransitionName] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const mountedRef = useRef(true);
  const profileRequestRef = useRef(null);
  const permissionCheckRequestRef = useRef(null);
  const permissionsVersionRef = useRef(null);
  const logoutPromiseRef = useRef(null);

  const clearAuthState = useCallback(() => {
    if (!mountedRef.current) {
      return;
    }

    setUser(null);
    setProfile(null);
    permissionsVersionRef.current = null;
    setLoading(false);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError("");
  }, []);

  const loadProfile = useCallback(async () => {
    if (
      profileRequestRef.current
    ) {
      return profileRequestRef.current;
    }

    const request = (async () => {
      try {
        const response = await getCurrentUser();

        if (!response?.success || !response?.user) {
          return null;
        }

        const normalizedUser =
          normalizeUser(response.user);

        const normalizedProfile =
          normalizeProfile(response.profile);

        const validation =
          validateProfile(normalizedProfile);

        if (!validation.allowed) {
          throw new Error(validation.message);
        }

        if (!mountedRef.current) {
          return null;
        }

        setUser(normalizedUser);
        setProfile(normalizedProfile);
        permissionsVersionRef.current =
          normalizedProfile?.permissions_version ?? null;
        setAuthError("");

        return normalizedProfile;
      } finally {
        if (profileRequestRef.current === request) {
          profileRequestRef.current = null;
        }
      }
    })();

    profileRequestRef.current = request;

    return request;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    async function initializeAuth() {
      try {
        setLoading(true);
        setAuthError("");

        await loadProfile();
      } catch (error) {
        if (error?.status !== 401) {
          console.error(
            "Error inicializando autenticación:",
            error
          );
        }

        if (!mountedRef.current) {
          return;
        }

        clearAuthState();
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      mountedRef.current = false;
      profileRequestRef.current = null;
    };
  }, [clearAuthState, loadProfile]);

  const login = useCallback(
    async (email, password) => {
      const normalizedEmail =
        typeof email === "string"
          ? email.trim().toLowerCase()
          : "";

      setAuthError("");

      try {
        const response = await loginRequest(
          normalizedEmail,
          password
        );

        if (
          !response?.success ||
          !response?.user ||
          !response?.profile
        ) {
          const error = new Error(
            response?.message ||
              "No se pudo iniciar sesión."
          );

          setAuthError(error.message);

          return {
            success: false,
            error,
          };
        }

        const normalizedUser =
          normalizeUser(response.user);

        const normalizedProfile =
          normalizeProfile(response.profile);

        const validation =
          validateProfile(normalizedProfile);

        if (!validation.allowed) {
          await logoutRequest().catch(() => {});

          clearAuthState();

          const error = new Error(
            validation.message
          );

          setAuthError(error.message);

          return {
            success: false,
            error,
          };
        }

        if (!mountedRef.current) {
          return {
            success: false,
            error: new Error(
              "La sesión fue cancelada."
            ),
          };
        }

        setLoginTransitionName(normalizedProfile.nombres);
        setIsLoggingIn(true);

        await wait(320);

        if (!mountedRef.current) {
          return {
            success: false,
            error: new Error(
              "La sesión fue cancelada."
            ),
          };
        }

        setUser(normalizedUser);
        setProfile(normalizedProfile);
        permissionsVersionRef.current =
          normalizedProfile?.permissions_version ?? null;
        setAuthError("");

        await wait(880);

        if (mountedRef.current) {
          setIsLoggingIn(false);
        }

        return {
          success: true,
          user: normalizedUser,
          profile: normalizedProfile,
        };
      } catch (error) {
        console.error(
          "Error de login:",
          error
        );

        const message =
          getAuthErrorMessage(error);

        const normalizedError =
          new Error(message);

        setUser(null);
        setProfile(null);
        setAuthError(message);

        return {
          success: false,
          error: normalizedError,
        };
      }
    },
    [clearAuthState]
  );

  const logout = useCallback(
    (options = {}) => {
      if (logoutPromiseRef.current) {
        return logoutPromiseRef.current;
      }

      const showTransition = options?.showTransition === true;

      const operation = (async () => {
        if (showTransition) {
          setIsLoggingOut(true);
        }

        const minimumTransition = showTransition
          ? wait(1200)
          : Promise.resolve();

        try {
          await logoutRequest();
        } catch (error) {
          console.error(
            "Error cerrando sesión:",
            error
          );
        } finally {
          await minimumTransition;
          clearAuthState();
          setAuthError("");

          if (showTransition) {
            await wait(180);

            if (mountedRef.current) {
              setIsLoggingOut(false);
            }
          }
        }
      })().finally(() => {
        logoutPromiseRef.current = null;
      });

      logoutPromiseRef.current = operation;

      return operation;
    },
    [clearAuthState]
  );

  const refreshProfile = useCallback(async (options = {}) => {
    const silent = options?.silent === true;

    if (!silent) {
      setLoading(true);
    }

    try {
      const updatedProfile =
        await loadProfile();

      if (!updatedProfile) {
        clearAuthState();
        return null;
      }

      const validation =
        validateProfile(updatedProfile);

      if (!validation.allowed) {
        await logoutRequest().catch(() => {});

        clearAuthState();

        setAuthError(validation.message);

        return null;
      }

      return updatedProfile;
    } catch (error) {
      console.error(
        "Error refrescando perfil:",
        error
      );

      if (error?.status === 401 || error?.status === 403) {
        clearAuthState();
      }

      return null;
    } finally {
      if (mountedRef.current && !silent) {
        setLoading(false);
      }
    }
  }, [clearAuthState, loadProfile]);

  useEffect(() => {
    if (!user || !profile) {
      return undefined;
    }

    const syncPermissions = () => {
      if (
        document.visibilityState !== "visible" ||
        !navigator.onLine ||
        permissionCheckRequestRef.current
      ) {
        return;
      }

      const request = (async () => {
        try {
          const response = await getPermissionsVersion();
          const nextVersion = response?.permissions_version;

          if (!response?.success || typeof nextVersion !== "string") {
            return;
          }

          if (permissionsVersionRef.current === null) {
            permissionsVersionRef.current = nextVersion;
            return;
          }

          if (permissionsVersionRef.current === nextVersion) {
            return;
          }

          const updatedProfile = await refreshProfile({ silent: true });

          if (updatedProfile) {
            permissionsVersionRef.current =
              updatedProfile.permissions_version ?? nextVersion;
          }
        } catch (error) {
          console.error(
            "Error comprobando la versión de permisos:",
            error
          );
        } finally {
          if (permissionCheckRequestRef.current === request) {
            permissionCheckRequestRef.current = null;
          }
        }
      })();

      permissionCheckRequestRef.current = request;
    };

    const intervalId = window.setInterval(syncPermissions, 60_000);

    window.addEventListener("focus", syncPermissions);
    document.addEventListener("visibilitychange", syncPermissions);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncPermissions);
      document.removeEventListener("visibilitychange", syncPermissions);
    };
  }, [profile, refreshProfile, user]);

  const isAuthenticated =
    Boolean(user && profile);

  const value = {
    user,
    profile,
    loading,
    authError,
    clearAuthError,
    login,
    logout,
    isLoggingOut,
    refreshProfile,
    isAuthenticated,

    hasAccessTotal:
      profile?.acceso_total === true ||
      profile?.role?.acceso_total === true,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginTransition visible={isLoggingIn} name={loginTransitionName} />
      <LogoutTransition visible={isLoggingOut} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider"
    );
  }

  return context;
}
