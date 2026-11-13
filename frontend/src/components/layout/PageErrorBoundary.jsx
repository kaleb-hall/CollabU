import { Component } from 'react';

// If a page crashes or its code fails to download (for example right after a new
// version is deployed), show a way out instead of a blank screen.
export default class PageErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const reload = this.props.onReload ?? (() => window.location.reload());
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-deep px-4">
        <div role="alert" className="max-w-sm rounded-xl border border-line bg-card p-6 text-center">
          <p className="font-display text-xl text-ink">This page did not load</p>
          <p className="mt-2 text-ink-soft">CollabU may have just been updated. Reloading usually fixes it.</p>
          <button
            type="button"
            onClick={reload}
            className="mt-5 inline-flex h-10 items-center rounded-card bg-ink px-4 font-semibold text-paper hover:bg-ink-soft"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
