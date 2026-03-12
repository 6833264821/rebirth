import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors", {
  variants: {
    variant: {
      default: "bg-secondary text-secondary-foreground",
      accent: "bg-accent/20 text-foreground",
      success: "bg-success/15 text-success",
      warning: "bg-warning/20 text-foreground",
      danger: "bg-danger/15 text-danger"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
