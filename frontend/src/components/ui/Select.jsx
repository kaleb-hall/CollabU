import { useId } from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { CaretUpDown, Check } from '@phosphor-icons/react';

// A labelled dropdown. options: [{ value, label, dot? }]
export default function Select({ label, value, onChange, options, placeholder = 'Choose one', disabled = false }) {
  const id = useId();
  const items = Object.fromEntries(options.map((option) => [option.value, option.label]));

  return (
    <div>
      <span id={id} className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <BaseSelect.Root value={value} onValueChange={onChange} items={items} disabled={disabled}>
        <BaseSelect.Trigger
          aria-labelledby={id}
          className="flex h-9 w-full items-center justify-between gap-2 rounded-card border border-line bg-card px-3 text-left text-ink hover:border-ink-faint"
        >
          <BaseSelect.Value placeholder={placeholder} />
          <BaseSelect.Icon><CaretUpDown size={16} className="text-ink-faint" aria-hidden="true" /></BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={4} className="z-[60]">
            <BaseSelect.Popup className="max-h-72 min-w-[var(--anchor-width)] overflow-y-auto rounded-card border border-line bg-card p-1 shadow-lift">
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-ink outline-none data-[highlighted]:bg-paper-deep"
                >
                  {option.dot && <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: option.dot }} />}
                  <BaseSelect.ItemText className="flex-1">{option.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator><Check size={14} aria-hidden="true" /></BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
}
