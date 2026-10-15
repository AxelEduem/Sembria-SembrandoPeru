import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export default function ComboboxField({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Selecciona o escribe una opción",
  disabled = false,
  required = false,
  id,
  className = "",
}) {
  const generatedId = useId();
  const fieldId = id || `combobox-${generatedId}`;

  const containerRef = useRef(null);

  const [open, setOpen] = useState(false);

  const normalizedOptions = options
    .filter(
      (option) =>
        option !== null &&
        option !== undefined &&
        String(option).trim() !== "",
    )
    .map((option) => String(option));

  const searchValue = String(value || "").trim().toLowerCase();

  const filteredOptions = normalizedOptions.filter((option) =>
    option.toLowerCase().includes(searchValue),
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  const handleChange = (event) => {
    onChange(event.target.value);
    setOpen(true);
  };

  const handleSelect = (option) => {
    onChange(option);
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (
      event.key === "Enter" &&
      open &&
      filteredOptions.length === 1
    ) {
      event.preventDefault();
      handleSelect(filteredOptions[0]);
    }
  };

  return (
    <div className="space-y-2.5">
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-semibold text-slate-700"
        >
          {label}

          {required && (
            <span className="ml-1 text-red-500">*</span>
          )}
        </label>
      )}

      <div
        ref={containerRef}
        className="relative"
      >
        <div className="relative">
          <Input
            id={fieldId}
            value={value || ""}
            onChange={handleChange}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            className={`h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 pr-11 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
          />

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => {
              if (!disabled) {
                setOpen((current) => !current);
              }
            }}
            className="absolute right-0 top-0 flex h-11 w-10 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 disabled:cursor-not-allowed"
            aria-label={`Mostrar opciones de ${
              label || "campo"
            }`}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                open
                  ? "rotate-180 text-emerald-600"
                  : ""
              }`}
              strokeWidth={1.9}
            />
          </button>
        </div>

        {open && !disabled && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
            <div className="border-b border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Search
                  className="h-3.5 w-3.5"
                  strokeWidth={1.8}
                />

                <span>
                  {value
                    ? "Filtrando opciones..."
                    : "Opciones disponibles"}
                </span>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto p-1.5">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const selected =
                    String(value || "").toLowerCase() ===
                    option.toLowerCase();

                  return (
                    <button
                      key={option}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      onClick={() => handleSelect(option)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                        selected
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          selected
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {selected ? (
                          <Check
                            className="h-3.5 w-3.5"
                            strokeWidth={2.5}
                          />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1 truncate">
                        {option}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-7 text-center">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Search
                      className="h-4 w-4"
                      strokeWidth={1.8}
                    />
                  </div>

                  <p className="text-sm font-medium text-slate-600">
                    No se encontraron opciones
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Puedes continuar escribiendo una opción
                    personalizada.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 px-3.5 py-2">
              <p className="text-[11px] text-slate-400">
                Escribe para buscar o agregar una opción
                personalizada.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}