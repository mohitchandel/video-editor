import { AudioWaveform } from "lucide-react";
import { cn } from "cn";

type AppLogoProps = {
  withName?: boolean;
  className?: string;
};

export function AppLogo({ withName = true, className }: AppLogoProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex size-6 items-center justify-center rounded-md bg-primary/20 text-primary">
        <AudioWaveform className="size-3.5" aria-hidden />
      </span>
      {withName ? (
        <span className="text-sm font-semibold tracking-tight">Wavecraft</span>
      ) : null}
    </span>
  );
}
