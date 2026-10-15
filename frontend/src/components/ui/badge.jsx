import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  `
    inline-flex
    w-fit
    shrink-0
    items-center
    justify-center
    gap-1.5
    overflow-hidden
    rounded-full
    border
    px-2.5
    py-1
    text-[11px]
    font-semibold
    leading-none
    whitespace-nowrap
    transition-all
    duration-200

    focus-visible:border-ring
    focus-visible:ring-[3px]
    focus-visible:ring-ring/50

    aria-invalid:border-destructive
    aria-invalid:ring-destructive/20

    dark:aria-invalid:ring-destructive/40

    [&>svg]:pointer-events-none
    [&>svg]:size-3.5
    [&>svg]:shrink-0
  `,
  {
    variants: {
      variant: {
        default: `
          border-transparent
          bg-primary
          text-primary-foreground
          [a&]:hover:bg-primary/90
        `,

        secondary: `
          border-slate-200
          bg-slate-50
          text-slate-600
          [a&]:hover:bg-slate-100
        `,

        destructive: `
          border-red-100
          bg-red-50
          text-red-700
          focus-visible:ring-red-500/20
          dark:bg-red-950/40
          dark:text-red-400
          [a&]:hover:bg-red-100
        `,

        outline: `
          border-slate-200
          bg-white
          text-slate-600
          [a&]:hover:bg-slate-50
          [a&]:hover:text-slate-800
        `,

        ghost: `
          border-transparent
          text-slate-600
          [a&]:hover:bg-slate-50
          [a&]:hover:text-slate-900
        `,

        link: `
          border-transparent
          bg-transparent
          text-primary
          underline-offset-4
          [a&]:hover:underline
        `,
      },
    },

    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant = "default", asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(
        badgeVariants({
          variant,
          className,
        }),
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
