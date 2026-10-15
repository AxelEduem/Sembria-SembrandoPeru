import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, KeyRound, LogOut, UserRound } from "lucide-react";

import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import { useAuth } from "@/contexts/AuthContext";
import { getAvatarUrl } from "@/utils/avatar";

function getFullName(profile) {
  return (
    `${profile?.nombres?.trim() || ""} ${profile?.apellidos?.trim() || ""}`.trim() ||
    "Usuario"
  );
}

function getInitials(name) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function getInstitutionalCargo(profile) {
  return (
    profile?.cargo ||
    profile?.cargos ||
    profile?.integrante?.cargo ||
    profile?.integrante?.cargos ||
    null
  );
}

function ProfileAvatar({ avatarUrl, avatarPath, name }) {
  return avatarUrl ? (
    <EnlargeablePhoto
      src={avatarUrl}
      fallbackSrc={getAvatarUrl(avatarPath)}
      fallback={getInitials(name)}
      alt={`Foto de ${name}`}
      className="h-9 w-9 rounded-xl bg-[#2D5A3D] text-xs font-bold text-white sm:h-10 sm:w-10 sm:text-sm"
    />
  ) : (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#2D5A3D] text-xs font-bold text-white sm:h-10 sm:w-10 sm:text-sm"
    >
      {getInitials(name)}
    </span>
  );
}

function HeaderProfile({ profile }) {
  const { logout, isLoggingOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const fullName = getFullName(profile);
  const avatarUrl = getAvatarUrl(profile?.avatar_url) || getAvatarUrl(profile?.avatar_path);
  const institutionalCargo = getInstitutionalCargo(profile);
  const cargoName = institutionalCargo?.nombre || "Cargo no configurado";
  const areaName =
    profile?.area?.nombre ||
    profile?.areas?.nombre ||
    institutionalCargo?.area?.nombre ||
    profile?.integrante?.area?.nombre ||
    "";
  const systemRole = profile?.role?.nombre || profile?.role_info?.nombre || "";

  useEffect(() => {
    function handlePointer(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }

    function handleKey(event) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function handleLogout() {
    if (isLoggingOut) return;

    setOpen(false);
    await logout({ showTransition: true });
    navigate("/", { replace: true });
  }

  return (
    <div ref={containerRef} className="relative min-w-0 max-w-full">
      <div
        className="flex max-w-full min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-2 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:gap-2.5 sm:px-3"
      >
        <ProfileAvatar avatarUrl={avatarUrl} avatarPath={profile?.avatar_path} name={fullName} />
        <button
          ref={triggerRef}
          type="button"
          aria-label="Abrir menú de perfil"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls="header-profile-menu"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:gap-2.5"
        >
          <span className="min-w-0 text-left">
            <span className="block max-w-[92px] truncate text-[11px] font-semibold uppercase tracking-tight text-slate-800 sm:max-w-[190px] sm:text-sm">
              {fullName}
            </span>
            <span className="block max-w-[92px] truncate text-[9px] uppercase tracking-wide text-slate-500 sm:max-w-[190px] sm:text-xs">
              {cargoName}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {open && (
        <div
          id="header-profile-menu"
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(19rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 animate-in fade-in-0 zoom-in-95"
        >
          <div className="grid gap-3 px-4 py-3.5">
            {areaName && (
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Área</p>
                <p className="mt-0.5 truncate text-xs font-medium text-slate-700">{areaName}</p>
              </div>
            )}
            {systemRole && (
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Rol del sistema</p>
                <p className="mt-0.5 truncate text-xs font-medium text-slate-700">{systemRole}</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-2">
            <Link
              role="menuitem"
              to="/perfil-administracion"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <UserRound aria-hidden="true" className="h-4 w-4" />
              Mi perfil
            </Link>
            <Link
              role="menuitem"
              to="/seguridad"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <KeyRound aria-hidden="true" className="h-4 w-4" />
              Seguridad
            </Link>
            <button
              role="menuitem"
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-wait disabled:opacity-60"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HeaderProfile;
