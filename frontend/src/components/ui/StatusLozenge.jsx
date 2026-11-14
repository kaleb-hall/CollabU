import { statusInfo } from '../../lib/status';

// Status as text on a light tint of its color (never color alone)
export default function StatusLozenge({ status }) {
  const { label, color } = statusInfo(status);
  return (
    <span
      className="inline-flex h-5 items-center rounded-sm px-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      {label}
    </span>
  );
}
