import { WarningCircle } from '@phosphor-icons/react';
import Button from './Button';
import { getErrorMessage } from '../../lib/errors';

export default function ErrorState({ title = 'Something went wrong', error, onRetry }) {
  return (
    <div role="alert" className="rounded-card border border-line bg-card px-6 py-8 text-center">
      <WarningCircle size={32} className="mx-auto mb-3 text-accent" aria-hidden="true" />
      <p className="font-display text-xl text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-soft">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
