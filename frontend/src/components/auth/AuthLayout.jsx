import { Link } from 'react-router-dom';

// The quiet frame for signed-out pages: wordmark, one card, one way out
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper-deep px-4 py-10">
      <Link to="/" className="mx-auto font-display text-2xl text-ink">CollabU</Link>
      <main className="mx-auto mt-10 w-full max-w-sm flex-1">
        <div className="rounded-xl border border-line bg-card p-6 sm:p-8">
          <h1 className="font-display text-2xl text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-6 text-center text-ink-soft">{footer}</p>}
      </main>
    </div>
  );
}
