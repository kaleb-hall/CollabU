import { useState } from 'react';
import { addHours } from 'date-fns';
import { toast } from 'sonner';
import Button from '../ui/Button';
import Field from '../ui/Field';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import { useCreateBlock } from '../../hooks/useCalendarBlocks';
import { WEEKDAYS, buildBlockPayload, weekdayCode } from '../../lib/blockForm';
import { toInputValue } from '../../lib/dates';
import { getErrorMessage } from '../../lib/errors';
import { cx } from '../../lib/cx';

const TYPES = ['class', 'work', 'meeting', 'busy', 'sleep', 'other'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }));

// Block off time the scheduler should work around, once or every week
export default function BusyTimeDialog({ open, onOpenChange, startAt }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Add busy time" description="Plan schedule will not put work here.">
      {open && <BusyTimeForm startAt={startAt} onDone={() => onOpenChange(false)} />}
    </Modal>
  );
}

function BusyTimeForm({ startAt, onDone }) {
  const createBlock = useCreateBlock();
  const [form, setForm] = useState({
    title: '',
    description: '',
    block_type: 'class',
    start_time: toInputValue(startAt),
    end_time: toInputValue(addHours(startAt, 1)),
    repeats: false,
    repeat_days: [],
    repeat_until: '',
  });
  const set = (key) => (value) => setForm({ ...form, [key]: value?.target ? value.target.value : value });

  const toggleRepeats = (checked) => setForm({
    ...form,
    repeats: checked,
    repeat_days: checked && form.repeat_days.length === 0 ? [weekdayCode(form.start_time)] : form.repeat_days,
  });

  const toggleDay = (code) => setForm({
    ...form,
    repeat_days: form.repeat_days.includes(code) ? form.repeat_days.filter((day) => day !== code) : [...form.repeat_days, code],
  });

  const submit = (e) => {
    e.preventDefault();
    createBlock.mutate(buildBlockPayload(form), {
      onSuccess: (data) => {
        toast.success('Busy time added');
        data.warnings.forEach((warning) => toast(warning));
        onDone();
      },
      onError: (error) => toast.error(getErrorMessage(error, 'Could not add busy time')),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
        <Field label="What is it?" required maxLength={200} value={form.title} placeholder="CS 101 lecture" onChange={set('title')} />
        <Select label="Type" value={form.block_type} onChange={set('block_type')} options={TYPES} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" type="datetime-local" required value={form.start_time} className="font-mono" onChange={set('start_time')} />
        <Field label="Ends" type="datetime-local" required value={form.end_time} className="font-mono" onChange={set('end_time')} />
      </div>

      <fieldset className="space-y-3 rounded-card border border-line p-3">
        <label className="flex items-center gap-2 font-semibold text-ink">
          <input type="checkbox" checked={form.repeats} onChange={(e) => toggleRepeats(e.target.checked)} />
          Repeats every week
        </label>
        {form.repeats && (
          <>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Repeat on">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.code}
                  type="button"
                  aria-pressed={form.repeat_days.includes(day.code)}
                  onClick={() => toggleDay(day.code)}
                  className={cx(
                    'h-8 w-11 rounded-sm border text-xs font-semibold',
                    form.repeat_days.includes(day.code) ? 'border-ink bg-ink text-paper' : 'border-line text-ink-soft hover:border-ink-faint',
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <Field label="Until" type="date" required min={form.start_time.slice(0, 10)} value={form.repeat_until}
              className="font-mono" onChange={set('repeat_until')} />
          </>
        )}
      </fieldset>

      <Field label="Notes" as="textarea" rows={2} value={form.description} onChange={set('description')} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={createBlock.isPending}>{createBlock.isPending ? 'Adding...' : 'Add busy time'}</Button>
      </div>
    </form>
  );
}
