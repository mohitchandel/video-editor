"use client";

import { Slider } from "@/components/ui/slider";

type PropertySliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Shown after the value, e.g. "%" or "px". */
  unit?: string;
  format?: (value: number) => string;
  onChange: (value: number) => void;
};

/** Compact labeled slider row used throughout the inspector. */
export function PropertySlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  format,
  onChange,
}: PropertySliderProps) {
  const display = format ? format(value) : `${Math.round(value * 100) / 100}${unit}`;
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-[11px] text-foreground/80">{display}</span>
      </span>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </label>
  );
}
