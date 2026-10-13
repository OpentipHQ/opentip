"use client";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div className="inline-flex h-8 max-w-full items-center rounded-lg bg-muted p-[3px]" role="tablist" aria-label={label}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`h-full min-w-0 rounded-md px-3 text-sm font-medium ${selected ? "bg-background text-foreground shadow-sm" : "text-foreground/60 hover:text-foreground"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
