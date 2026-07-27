'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

/** Small shared building blocks for the Studio chrome. */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

type ToolButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  tone?: 'default' | 'accent' | 'ghost';
};

export function ToolButton({
  active,
  tone = 'default',
  className,
  children,
  ...props
}: ToolButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'label inline-flex items-center justify-center gap-2 whitespace-nowrap px-3 py-2 transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-30',
        tone === 'accent'
          ? 'bg-brass text-obsidian hover:bg-brass-soft'
          : tone === 'ghost'
            ? 'text-stone hover:text-paper'
            : cx(
                'border border-white/10 text-stone hover:border-white/25 hover:text-paper',
                active && 'border-brass/60 bg-brass/15 text-brass-soft',
              ),
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PanelSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-white/8 px-5 py-5 last:border-b-0">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="label text-ash">{title}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Numeric field with unit suffix, used all through the properties panel. */
export function NumberField({
  label,
  value,
  unit = 'mm',
  min,
  max,
  step = 10,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className={cx('block min-w-0', disabled && 'opacity-40')}>
      <span className="label mb-1.5 flex items-baseline gap-1 truncate text-ash">
        {label}
        <span className="text-[9px] tracking-normal text-ash/60">{unit}</span>
      </span>
      <input
        type="number"
        value={Math.round(value)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
        className="tabular w-full min-w-0 border border-white/12 bg-black/25 px-2 py-2 text-sm text-paper transition-colors focus:border-brass/60 focus:outline-none disabled:cursor-not-allowed"
      />
    </label>
  );
}

/** Segmented choice — finishes, handles, view modes. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  columns?: number;
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cx(
            'label border px-2 py-2 transition-colors duration-150',
            option.value === value
              ? 'border-brass/60 bg-brass/15 text-brass-soft'
              : 'border-white/10 text-stone hover:border-white/25 hover:text-paper',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** A dark card used for the modal dialogs that do warrant interrupting. */
export function Overlay({
  children,
  onDismiss,
}: {
  children: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onDismiss}
        className="absolute inset-0 cursor-default bg-obsidian/70 backdrop-blur-[2px]"
        tabIndex={onDismiss ? 0 : -1}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto scroll-slim border border-white/10 bg-[#1b1a18] shadow-2xl">
        {children}
      </div>
    </div>
  );
}
