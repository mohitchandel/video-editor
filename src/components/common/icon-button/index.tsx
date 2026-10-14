"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type IconButtonProps = {
  label: string;
  active?: boolean;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  children: ReactNode;
} & Omit<ComponentProps<typeof Button>, "children">;

/** Square icon button with a required accessible label shown as a tooltip. */
export function IconButton({
  label,
  active = false,
  tooltipSide = "bottom",
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            aria-pressed={active || undefined}
            className={cn(
              "text-muted-foreground hover:text-foreground",
              active &&
                "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary",
              className,
            )}
            {...props}
          >
            {children}
          </Button>
        }
      />
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}
