import { useId } from 'react';

export const inputClass =
  'w-full rounded-card border border-line bg-card px-3 py-2 text-ink placeholder:text-ink-faint transition-colors hover:border-ink-faint';

// A labelled input. Pass `as="textarea"` or `as="select"` for those elements.
export default function Field({ label, hint, as: Element = 'input', className, children, ...props }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      <Element id={id} className={inputClass} aria-describedby={hint ? `${id}-hint` : undefined} {...props}>
        {children}
      </Element>
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
