"use client";

type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

/** Native color input styled to match the inspector rows. */
export function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-foreground/80">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="size-6 cursor-pointer appearance-none rounded border border-input bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none"
        />
      </span>
    </label>
  );
}
