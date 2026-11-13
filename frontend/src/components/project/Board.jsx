import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { LayoutGroup, motion, MotionConfig } from 'motion/react';
import { toast } from 'sonner';
import TaskCard from './TaskCard';
import { useMoveTask } from '../../hooks/useTasks';
import { parseApiDate } from '../../lib/dates';
import { getErrorMessage } from '../../lib/errors';
import { STATUSES, statusInfo } from '../../lib/status';
import { cx } from '../../lib/cx';

const MotionLi = motion.li;

// The kanban board: drag cards between columns (mouse, touch or keyboard),
// or use each card's menu. Cards glide to their new column.
export default function Board({ projectId, tasks, onOpenTask }) {
  const moveTask = useMoveTask(projectId);
  const [dragging, setDragging] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // On touch screens, press and hold to pick a card up so the page can still scroll
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const move = (task, status) => {
    if (task.status === status) return;
    moveTask.mutate({ taskId: task.id, status }, {
      onError: (error) => toast.error(getErrorMessage(error, 'Could not move the task')),
    });
  };

  const byStatus = (status) => tasks
    .filter((task) => task.status === status)
    .sort((a, b) => parseApiDate(a.due_date) - parseApiDate(b.due_date));

  return (
    <MotionConfig reducedMotion="user">
      <DndContext
        sensors={sensors}
        accessibility={{ announcements: announcements(tasks) }}
        onDragStart={({ active }) => setDragging(tasks.find((task) => task.id === active.id))}
        onDragCancel={() => setDragging(null)}
        onDragEnd={({ active, over }) => {
          setDragging(null);
          const task = tasks.find((item) => item.id === active.id);
          if (task && over) move(task, over.id);
        }}
      >
        <LayoutGroup>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
            {STATUSES.map((status) => (
              <Column key={status.value} status={status} tasks={byStatus(status.value)}
                onOpenTask={onOpenTask} onMove={move} draggingId={dragging?.id} />
            ))}
          </div>
        </LayoutGroup>
        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
          {dragging && <TaskCard task={dragging} lifted />}
        </DragOverlay>
      </DndContext>
    </MotionConfig>
  );
}

function Column({ status, tasks, onOpenTask, onMove, draggingId }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.value });
  return (
    <section
      ref={setNodeRef}
      aria-label={status.label}
      className={cx(
        'flex w-[82vw] max-w-72 shrink-0 snap-start flex-col rounded-card bg-paper-deep/70 p-2 transition-colors sm:w-64',
        isOver && 'bg-paper-deep ring-2 ring-focus/40',
      )}
    >
      <h2 className="flex items-center gap-2 px-1.5 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: status.color }} />
        {status.label}
        <span className="font-mono font-normal text-ink-faint">{tasks.length}</span>
      </h2>
      <ul className="flex min-h-24 flex-1 flex-col gap-2">
        {tasks.map((task) => (
          <DraggableCard key={task.id} task={task} onOpen={onOpenTask} onMove={onMove} hidden={draggingId === task.id} />
        ))}
        {tasks.length === 0 && (
          <li className="rounded-sm border border-dashed border-line px-3 py-6 text-center text-xs text-ink-faint">
            Drop tasks here
          </li>
        )}
      </ul>
    </section>
  );
}

function DraggableCard({ task, onOpen, onMove, hidden }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: task.id });
  return (
    <MotionLi
      ref={setNodeRef}
      layout="position"
      layoutId={`task-${task.id}`}
      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
      className={cx(hidden && 'opacity-40')}
    >
      <TaskCard
        task={task}
        onOpen={onOpen}
        onMove={onMove}
        dragHandle={{ ...attributes, ...listeners, 'aria-roledescription': 'task card' }}
      />
    </MotionLi>
  );
}

// What screen readers hear while dragging with the keyboard
function announcements(tasks) {
  const title = (id) => tasks.find((task) => task.id === id)?.title ?? 'Task';
  return {
    onDragStart: ({ active }) => `Picked up ${title(active.id)}. Use the arrow keys to move between columns, Space to drop, Escape to cancel.`,
    onDragOver: ({ active, over }) => (over ? `${title(active.id)} is over ${statusInfo(over.id).label}.` : `${title(active.id)} is not over a column.`),
    onDragEnd: ({ active, over }) => (over ? `${title(active.id)} moved to ${statusInfo(over.id).label}.` : `${title(active.id)} was put back.`),
    onDragCancel: ({ active }) => `Moving ${title(active.id)} was cancelled.`,
  };
}
