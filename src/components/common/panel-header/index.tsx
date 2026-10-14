import type { ReactNode } from "react";

type PanelHeaderProps = {
  title: string;
  actions?: ReactNode;
};

export function PanelHeader({ title, actions }: PanelHeaderProps) {
  return (
    <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-b px-3">
      <h2 className="text-xs font-semibold tracking-wide text-foreground">
        {title}
      </h2>
      {actions}
    </div>
  );
}
