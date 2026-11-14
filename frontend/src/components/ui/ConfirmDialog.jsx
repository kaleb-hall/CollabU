import { AlertDialog } from '@base-ui/react/alert-dialog';
import Button from './Button';

// Asks before something big or that cannot be undone. `trigger` is the button that opens it.
export default function ConfirmDialog({ trigger, title, description, confirmLabel, onConfirm, confirmVariant = 'danger' }) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger render={trigger} />
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-[60] bg-scrim transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[60] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-card border border-line bg-card p-6 shadow-lift transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
          <AlertDialog.Title className="font-display text-xl text-ink">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-ink-soft">{description}</AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Close render={<Button variant="secondary">Cancel</Button>} />
            <AlertDialog.Close render={<Button variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>} />
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
