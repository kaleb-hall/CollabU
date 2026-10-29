import { Dialog } from '@base-ui/react/dialog';
import { X } from '@phosphor-icons/react';

// A panel that slides in from the left on phones
export default function Drawer({ open, onOpenChange, title, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/30 transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] overflow-y-auto border-r border-line bg-paper-deep p-3 transition-transform duration-200 data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full">
          <div className="mb-2 flex items-center justify-between px-2">
            <Dialog.Title className="font-display text-lg text-ink">{title}</Dialog.Title>
            <Dialog.Close aria-label="Close" className="rounded-card p-1.5 text-ink-soft hover:bg-card hover:text-ink">
              <X size={18} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
