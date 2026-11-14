import { useMemo, useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { Plus } from '@phosphor-icons/react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import AppShell from '../components/layout/AppShell';
import BusyTimeDialog from '../components/calendar/BusyTimeDialog';
import CalendarToolbar from '../components/calendar/CalendarToolbar';
import EventDialog from '../components/calendar/EventDialog';
import Button from '../components/ui/Button';
import ErrorState from '../components/ui/ErrorState';
import { useCalendarBlocks } from '../hooks/useCalendarBlocks';
import { useMyTasks } from '../hooks/useTasks';
import { toCalendarEvents } from '../lib/calendarEvents';
import { normalizeRange, weekRange } from '../lib/calendarRange';
import { projectColor } from '../lib/projectColor';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { 'en-US': enUS } });
const VIEWS = ['month', 'week', 'day', 'agenda'];
const DAY_START = new Date(1970, 0, 1, 6);
const DAY_END = new Date(1970, 0, 1, 23);

// Phones start on a single day; everything else on the week
const startingView = () => (window.matchMedia?.('(max-width: 639px)').matches ? 'day' : 'week');

export default function Calendar() {
  return (
    <AppShell>
      <CalendarPage />
    </AppShell>
  );
}

function CalendarPage() {
  // The page owns the visible date and view so a refetch can never jump back to today
  const [date, setDate] = useState(() => new Date());
  const [view, setView] = useState(startingView);
  const [range, setRange] = useState(() => weekRange(new Date()));
  const [adding, setAdding] = useState(null); // the start time for new busy time
  const [selected, setSelected] = useState(null);

  const tasksQuery = useMyTasks();
  const blocksQuery = useCalendarBlocks(range);
  const events = useMemo(
    () => toCalendarEvents(tasksQuery.data ?? [], blocksQuery.data ?? []),
    [tasksQuery.data, blocksQuery.data],
  );
  const error = tasksQuery.error || blocksQuery.error;

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Calendar</h1>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
            <span className="flex items-center gap-1.5"><span aria-hidden="true" className="cal-key cal-key-task" />Your tasks, by project color</span>
            <span className="flex items-center gap-1.5"><span aria-hidden="true" className="cal-key cal-key-block" />Busy time (classes, work, ...)</span>
          </p>
        </div>
        <Button onClick={() => setAdding(nextHour())}>
          <Plus size={16} weight="bold" aria-hidden="true" />Add busy time
        </Button>
      </header>

      {error ? (
        <ErrorState title="Could not load your calendar" error={error} onRetry={() => { tasksQuery.refetch(); blocksQuery.refetch(); }} />
      ) : (
        <div className="collabu-calendar h-[max(36rem,calc(100vh-14rem))] overflow-hidden rounded-card border border-line bg-card">
          <BigCalendar
            localizer={localizer}
            events={events}
            date={date}
            view={view}
            views={VIEWS}
            onNavigate={setDate}
            onView={setView}
            onRangeChange={(visible) => setRange(normalizeRange(visible))}
            onSelectEvent={setSelected}
            onSelectSlot={({ start }) => setAdding(start)}
            selectable
            step={30}
            timeslots={2}
            min={DAY_START}
            max={DAY_END}
            scrollToTime={new Date(1970, 0, 1, 8)}
            components={{ toolbar: CalendarToolbar }}
            eventPropGetter={(event) => ({
              className: event.kind === 'task' ? 'cal-task' : 'cal-block',
              style: event.kind === 'task' ? { '--event-color': projectColor(event.data.project_id) } : undefined,
            })}
          />
        </div>
      )}

      <BusyTimeDialog open={adding !== null} onOpenChange={(open) => { if (!open) setAdding(null); }} startAt={adding ?? new Date()} />
      <EventDialog event={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function nextHour() {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return date;
}
