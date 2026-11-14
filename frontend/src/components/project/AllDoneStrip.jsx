import { SealCheck } from '@phosphor-icons/react';
import Button from '../ui/Button';

// Shown to everyone once every task is done. The project does not finish by itself,
// in case someone was about to add one more task.
export default function AllDoneStrip({ onComplete, completing }) {
  return (
    <div role="status" className="mb-6 flex flex-col gap-3 rounded-card border border-status-done/40 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-ink">
        <SealCheck size={22} weight="duotone" className="shrink-0 text-status-done" aria-hidden="true" />
        <span><span className="font-semibold">All tasks are done.</span> Ready to complete the project?</span>
      </p>
      <Button size="sm" onClick={onComplete} disabled={completing}>Complete project</Button>
    </div>
  );
}
