"use client";

interface Props {
  checked: boolean;
  onChange: () => void;
  /** Accessible label, e.g. "Select INV-0012" or "Select all". */
  label: string;
}

export function RowCheckbox({ checked, onChange, label }: Props) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="rounded border-neutral-300 dark:border-neutral-600 accent-neutral-950 dark:accent-neutral-50"
    />
  );
}
