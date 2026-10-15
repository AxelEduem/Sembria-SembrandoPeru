import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  `
    inline-flex
    shrink-0
    items-center
    justify-center
    gap-2
    rounded-xl
    text-sm
    font-medium
    whitespace-nowrap
    transition-all
    duration-200
    outline-none
    cursor-pointer

    focus-visible:border-ring
    focus-visible:ring-[3px]
    focus-visible:ring-ring/50

    disabled:pointer-events-none
    disabled:opacity-50

    aria-invalid:border-destructive
    aria-invalid:ring-destructive/20

    dark:aria-invalid:ring-destructive/40

    [&_svg]:pointer-events-none
    [&_svg]:shrink-0
    [&_svg:not([class*='size-'])]:size-4
  `,
  {
    variants: {
      variant: {
        default: `
          bg-primary
          text-primary-foreground
          shadow-sm
          hover:bg-primary/90
          hover:shadow-md
        `,

        destructive: `
          bg-destructive
          text-white
          shadow-sm
          hover:bg-destructive/90
          hover:shadow-md
          focus-visible:ring-destructive/20

          dark:bg-destructive/60
          dark:focus-visible:ring-destructive/40
        `,

        outline: `
          border
          border-slate-200
          bg-white
          text-slate-700
          shadow-sm
          hover:bg-slate-50
          hover:border-slate-300
          hover:text-slate-900
        `,

        secondary: `
          bg-secondary
          text-secondary-foreground
          hover:bg-secondary/80
        `,

        ghost: `
          text-slate-600
          hover:bg-slate-50
          hover:text-slate-900
        `,

        link: `
          text-primary
          underline-offset-4
          hover:underline
        `,
      },

      size: {
        default: `
          h-9
          px-4
          py-2
          has-[>svg]:px-3
        `,

        xs: `
          h-7
          gap-1
          rounded-lg
          px-2
          text-xs
          has-[>svg]:px-1.5
          [&_svg:not([class*='size-'])]:size-3
        `,

        sm: `
          h-8
          gap-1.5
          rounded-lg
          px-3
          has-[>svg]:px-2.5
        `,

        lg: `
          h-10
          rounded-xl
          px-6
          has-[>svg]:px-4
        `,

        icon: `
          size-9
        `,

        "icon-xs": `
          size-7
          rounded-lg
          [&_svg:not([class*='size-'])]:size-3
        `,

        "icon-sm": `
          size-8
          rounded-lg
        `,

        "icon-lg": `
          size-10
          rounded-xl
        `,
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({ className, variant = "default", size = "default", asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        buttonVariants({
          variant,
          size,
          className,
        }),
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
