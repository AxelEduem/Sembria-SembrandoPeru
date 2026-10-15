import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

function Table({
  className,
  containerClassName,
  loading = false,
  loadingLabel = "Cargando datos...",
  ...props
}) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "relative w-full overflow-x-auto",
        loading && "min-h-52",
        containerClassName,
      )}
      aria-busy={loading}
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom text-sm transition-opacity",
          loading && "pointer-events-none opacity-35",
          className,
        )}
        {...props}
      />

      {loading && (
        <div
          className="absolute inset-0 z-10 flex min-h-52 items-center justify-center bg-white/85 backdrop-blur-[1px]"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <LoaderCircle
              className="h-7 w-7 animate-spin text-[#2D5A3D]"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-slate-600">{loadingLabel}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />;
}

function TableBody({ className, ...props }) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-muted/50 border-t font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
