export default function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="rounded-card border border-dashed border-line px-6 py-10 text-center">
      {Icon && <Icon size={36} className="mx-auto mb-3 text-ink-faint" aria-hidden="true" />}
      <p className="font-display text-xl text-ink">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
