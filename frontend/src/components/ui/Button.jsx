import { cx } from '../../lib/cx';

const VARIANTS = {
  primary: 'bg-ink text-paper hover:bg-ink-soft',
  secondary: 'border border-line bg-card text-ink hover:bg-paper-deep',
  ghost: 'text-ink-soft hover:bg-paper-deep hover:text-ink',
  danger: 'bg-accent text-on-accent hover:opacity-90',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4',
  icon: 'h-10 w-10 justify-center',
};

export default function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center gap-2 rounded-card font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
