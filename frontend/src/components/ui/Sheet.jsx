import { Dialog } from '@base-ui/react/dialog';
import { X } from '@phosphor-icons/react';

// A panel that slides in from the right (full screen on phones), for details next to the page
export default function Sheet({ open, onOpenChange, title, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-scrim transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-paper shadow-lift transition-transform duration-200 ease-out data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full sm:w-[34rem]">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
            <Dialog.Title className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{title}</Dialog.Title>
            <Dialog.Close aria-label="Close" className="rounded-card p-1.5 text-ink-soft hover:bg-paper-deep hover:text-ink">
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
