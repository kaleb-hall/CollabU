import { Dialog } from '@base-ui/react/dialog';
import { X } from '@phosphor-icons/react';
import { cx } from '../../lib/cx';

// A dialog that slides up from the bottom on phones and sits centered on larger screens.
// Base UI handles focus trapping, Escape, and returning focus when it closes.
export default function Modal({ open, onOpenChange, title, description, children, className }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/30 transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup
          className={cx(
            'fixed z-50 inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-xl border border-line bg-card p-6 shadow-lift',
            'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(36rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card',
            'transition-[transform,opacity] duration-200 data-[starting-style]:translate-y-6 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-6 data-[ending-style]:opacity-0',
            'sm:data-[starting-style]:-translate-y-[46%] sm:data-[ending-style]:-translate-y-[46%]',
            className,
          )}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-2xl text-ink">{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-1 text-sm text-ink-soft">{description}</Dialog.Description>}
            </div>
            <Dialog.Close aria-label="Close" className="rounded-card p-1.5 text-ink-soft hover:bg-paper-deep hover:text-ink">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
