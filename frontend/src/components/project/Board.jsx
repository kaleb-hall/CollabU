import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { LayoutGroup, LazyMotion, m, MotionConfig } from 'motion/react';
import { toast } from 'sonner';
import TaskCard from './TaskCard';
import { placeTask, useMoveTask } from '../../hooks/useTasks';
import { parseApiDate } from '../../lib/dates';
import { getErrorMessage } from '../../lib/errors';
import { STATUSES, statusInfo } from '../../lib/status';
import { cx } from '../../lib/cx';
import { prefersReducedMotion } from '../../lib/motion';

const MotionLi = m.li;
const loadMotionFeatures = () => import('./motionFeatures').then((module) => module.default);
const DROP_MS = 220;
const DROP_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const LANDING_TIMEOUT_MS = 600;

// The kanban board: drag cards between columns (mouse, touch or keyboard),
// or use each card's menu. Cards glide to their new column.
export default function Board({ projectId, tasks, onOpenTask }) {
  const queryClient = useQueryClient();
  const moveTask = useMoveTask(projectId);
  const [dragging, setDragging] = useState(null);
  // The card that was just dropped lands where it was let go, so it skips the glide
  const [droppedId, setDroppedId] = useState(null);
  // While a dropped card is on its way to its new column: { taskId, status, droppedAt, done }
  const [landing, setLanding] = useState(null);
  const landingRef = useRef(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // On touch screens, press and hold to pick a card up so the page can still scroll
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const move = (task, status, previousStatus = task.status) => {
    if (previousStatus === status) return;
    moveTask.mutate({ taskId: task.id, status, previousStatus }, {
      onError: (error) => toast.error(getErrorMessage(error, 'Could not move the task')),
    });
  };

  // From the Move to menu: the card glides to its new column
  const moveFromMenu = (task, status) => {
    setDroppedId(null);
    move(task, status);
  };

  // After a drop: the lifted copy waits at the drop point until the card shows up in its new
  // column; the card then starts from the drop point and settles into its slot (see useLanding).
  const drop = (task, status, droppedAt) => {
    if (task.status === status) return;
    const next = { taskId: task.id, status, droppedAt };
    landingRef.current = next;
    setDroppedId(task.id);
    setLanding(next);
    placeTask(queryClient, projectId, task.id, status);
    move(task, status, task.status);
  };

  // Stable, so a redraw in the middle of a landing does not restart it
  const landed = useCallback(() => {
    landingRef.current?.done?.();
    landingRef.current = null;
    setLanding(null);
  }, []);

  // Keeps the lifted copy on screen until the card has landed (or a short safety timeout)
  const dropAnimation = () => new Promise((resolve) => {
    if (!landingRef.current) return resolve();
    landingRef.current.done = resolve;
    setTimeout(resolve, LANDING_TIMEOUT_MS);
  });

  const byStatus = (status) => tasks
    .filter((task) => task.status === status)
    .sort((a, b) => parseApiDate(a.due_date) - parseApiDate(b.due_date));

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadMotionFeatures} strict>
      <DndContext
        sensors={sensors}
        accessibility={{ announcements: announcements(tasks) }}
        onDragStart={({ active }) => setDragging(tasks.find((task) => task.id === active.id))}
        onDragCancel={() => setDragging(null)}
        onDragEnd={({ active, over }) => {
          const task = tasks.find((item) => item.id === active.id);
          if (task && over) drop(task, over.id, active.rect.current.translated);
          setDragging(null);
        }}
      >
        <LayoutGroup>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
            {STATUSES.map((status) => (
              <Column key={status.value} status={status} tasks={byStatus(status.value)}
                onOpenTask={onOpenTask} onMove={moveFromMenu} draggingId={dragging?.id} droppedId={droppedId}
                landing={landing} onLanded={landed} />
            ))}
          </div>
        </LayoutGroup>
        <DragOverlay dropAnimation={dropAnimation}>
          {dragging && <TaskCard task={dragging} lifted />}
        </DragOverlay>
      </DndContext>
      </LazyMotion>
    </MotionConfig>
  );
}

function Column({ status, tasks, onOpenTask, onMove, draggingId, droppedId, landing, onLanded }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.value });
  return (
    <section
      ref={setNodeRef}
      aria-label={status.label}
      className={cx(
        // Phones: one column per swipe. Wider screens: the five columns share the width
        'flex w-[82vw] max-w-72 shrink-0 snap-start flex-col rounded-card bg-paper-deep/70 p-2 transition-colors sm:w-64 xl:w-auto xl:min-w-52 xl:max-w-none xl:flex-1',
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
          <DraggableCard
            key={task.id}
            task={task}
            onOpen={onOpenTask}
            onMove={onMove}
            // Hidden while lifted, and in its old column while it is landing in the new one
            hidden={draggingId === task.id || (landing?.taskId === task.id && landing.status !== task.status)}
            glide={droppedId !== task.id}
            landingFrom={landing?.taskId === task.id && landing.status === task.status ? landing.droppedAt : null}
            onLanded={onLanded}
          />
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

function DraggableCard({ task, onOpen, onMove, hidden, glide, landingFrom, onLanded }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: task.id });
  const node = useRef(null);
  useLanding(node, landingFrom, onLanded);
  return (
    <MotionLi
      ref={(element) => { setNodeRef(element); node.current = element; }}
      data-task-id={task.id}
      layout="position"
      layoutId={glide ? `task-${task.id}` : undefined}
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

// When a dropped card appears in its new column: before the screen paints, move it to where
// it was let go (tilted and raised, like the lifted copy), then let it settle into its slot.
function useLanding(node, from, onLanded) {
  // Each drop lands once, even when React runs effects twice in development
  const landedFrom = useRef(null);
  useLayoutEffect(() => {
    if (!from || !node.current || landedFrom.current === from) return;
    landedFrom.current = from;
    const element = node.current;
    if (!prefersReducedMotion() && element.animate) {
      const slot = element.getBoundingClientRect();
      element.animate(
        [
          { transform: `translate(${from.left - slot.left}px, ${from.top - slot.top}px) rotate(-2deg) scale(1.03)`, boxShadow: 'var(--elev-lift)' },
          { transform: 'none', boxShadow: '0 0 0 transparent' },
        ],
        { duration: DROP_MS, easing: DROP_EASING },
      );
    }
    onLanded();
  }, [from, node, onLanded]);
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
