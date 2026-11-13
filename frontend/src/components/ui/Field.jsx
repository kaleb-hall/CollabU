import { useId } from 'react';

export const inputClass =
  'w-full rounded-card border border-line bg-card px-3 py-2 text-ink placeholder:text-ink-faint transition-colors hover:border-ink-faint';

// A labelled input. Pass `as="textarea"` or `as="select"` for those elements.
// `className` styles the wrapper; `inputClassName` styles only the input (for example font-mono).
export default function Field({ label, hint, as: Element = 'input', className, inputClassName, children, ...props }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
      <Element id={id} className={inputClassName ? `${inputClass} ${inputClassName}` : inputClass} aria-describedby={hint ? `${id}-hint` : undefined} {...props}>
        {children}
      </Element>
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
