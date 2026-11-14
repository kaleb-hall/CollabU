import { useEffect, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { LazyMotion, MotionConfig, m } from 'motion/react';
import { toast } from 'sonner';
import Button from '../ui/Button';
import Field from '../ui/Field';
import { useSendFinalNote } from '../../hooks/useProjects';
import { getErrorMessage } from '../../lib/errors';
import { prefersReducedMotion } from '../../lib/motion';

const MotionDiv = m.div;
const MotionSpan = m.span;
const MotionPath = m.path;
const MotionForm = m.form;

const loadMotionFeatures = () => import('./motionFeatures').then((module) => module.default);

const COLORS = [1, 2, 3, 4, 5, 6].map((n) => `var(--confetti-${n})`);
const PIECES = 36;
const RAYS = 10;
// When the note box shows up, after the stamp and the first burst of confetti
const NOTE_DELAY_MS = 1500;

// Paper confetti, spread evenly with a little wobble. No random numbers, so every
// celebration looks the same and nothing changes between renders.
const confetti = Array.from({ length: PIECES }, (_, i) => {
  const angle = i * 2.39996; // golden angle in radians, spreads pieces evenly
  const reach = 110 + ((i * 47) % 90);
  return {
    id: i,
    color: COLORS[i % COLORS.length],
    shape: i % 3,
    x: Math.cos(angle) * reach * 1.6,
    rise: Math.sin(angle) * reach - 60,
    fall: 160 + ((i * 31) % 110),
    spin: (i % 2 ? 1 : -1) * (240 + ((i * 53) % 480)),
    delay: (i % 6) * 0.03,
  };
});

// The moment a project is finished: a stamp lands, the check draws itself, paper confetti
// bursts out, and then the person can send the team a final note.
export default function Celebration({ project, stats, open, onClose }) {
  const reduced = prefersReducedMotion();
  const [noteReady, setNoteReady] = useState(reduced);

  useEffect(() => {
    if (!open || reduced) return undefined;
    const timer = setTimeout(() => setNoteReady(true), NOTE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [open, reduced]);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-scrim transition-opacity duration-300 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-card border border-line bg-card px-6 pb-6 pt-4 text-center shadow-lift outline-none transition-opacity duration-200 data-[ending-style]:opacity-0">
          <MotionConfig reducedMotion="user">
            <LazyMotion features={loadMotionFeatures} strict>
              <div className="relative mx-auto flex h-44 items-center justify-center" aria-hidden="true">
                {!reduced && <Burst />}
                <Stamp still={reduced} />
              </div>
              <MotionDiv
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, type: 'spring', stiffness: 380, damping: 22 }}
              >
                <Dialog.Title className="font-display text-3xl text-ink">Project complete!</Dialog.Title>
                <Dialog.Description className="mt-1 text-ink-soft">
                  <span className="font-semibold text-ink">{project.title}</span> is done.
                </Dialog.Description>
                <p className="mt-2 font-mono text-xs uppercase tracking-wide text-ink-faint">
                  {stats.done} {stats.done === 1 ? 'task' : 'tasks'} done in {stats.took.toLowerCase()}
                </p>
              </MotionDiv>
              {noteReady && <FinalNote project={project} onDone={onClose} animate={!reduced} />}
            </LazyMotion>
          </MotionConfig>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Stamp({ still }) {
  return (
    <MotionDiv
      className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-accent bg-accent-soft"
      initial={still ? false : { scale: 2.2, opacity: 0, rotate: -24 }}
      animate={{ scale: 1, opacity: 1, rotate: -8 }}
      transition={{ type: 'spring', stiffness: 520, damping: 14, mass: 0.9 }}
    >
      <span className="absolute inset-1.5 rounded-full border border-dashed border-accent opacity-60" />
      <svg viewBox="0 0 48 48" className="h-12 w-12 text-accent">
        <MotionPath
          d="M12 25 L21 34 L37 15"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={still ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.35, ease: [0.65, 0, 0.35, 1] }}
        />
      </svg>
    </MotionDiv>
  );
}

function Burst() {
  return (
    <>
      {/* Ink marks shooting out of the stamp as it lands */}
      {Array.from({ length: RAYS }, (_, i) => (
        <MotionSpan
          key={`ray-${i}`}
          className="absolute left-1/2 top-1/2 -ml-0.5 -mt-1.5 h-3 w-1 rounded-full"
          style={{ background: COLORS[i % COLORS.length], rotate: (360 / RAYS) * i }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: [0, Math.sin((2 * Math.PI * i) / RAYS) * 78],
            y: [0, -Math.cos((2 * Math.PI * i) / RAYS) * 78],
            opacity: [0, 1, 0],
          }}
          transition={{ delay: 0.12, duration: 0.5, ease: 'easeOut' }}
        />
      ))}
      {/* Paper confetti: pops up and out, then flutters down and fades */}
      {confetti.map((piece) => (
        <MotionSpan
          key={piece.id}
          className="absolute left-1/2 top-1/2"
          style={{
            background: piece.color,
            width: piece.shape === 1 ? 8 : 7,
            height: piece.shape === 0 ? 12 : piece.shape === 1 ? 8 : 4,
            borderRadius: piece.shape === 1 ? '9999px' : '1px',
          }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
          animate={{
            x: [0, piece.x * 0.8, piece.x],
            y: [0, piece.rise, piece.rise + piece.fall],
            rotate: [0, piece.spin * 0.5, piece.spin],
            opacity: [0, 1, 1, 0],
          }}
          transition={{ delay: 0.15 + piece.delay, duration: 1.9, times: [0, 0.3, 1], ease: ['easeOut', 'easeIn'] }}
        />
      ))}
    </>
  );
}

function FinalNote({ project, onDone, animate }) {
  const send = useSendFinalNote(project.id);
  const [message, setMessage] = useState('');

  const submit = (e) => {
    e.preventDefault();
    send.mutate(message.trim(), {
      onSuccess: () => {
        toast.success('Your note was sent to the team');
        onDone();
      },
      onError: (error) => toast.error(getErrorMessage(error, 'Could not send the note')),
    });
  };

  return (
    <MotionForm
      onSubmit={submit}
      className="mt-6 border-t border-line pt-5 text-left"
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Field
        label="Send the team a final note"
        hint="Optional. Everyone on the project gets it, and it stays on the summary."
        as="textarea"
        rows={3}
        maxLength={2000}
        value={message}
        placeholder="Thanks everyone, we pulled it off!"
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>Skip</Button>
        <Button type="submit" disabled={send.isPending || !message.trim()}>
          {send.isPending ? 'Sending...' : 'Send note'}
        </Button>
      </div>
    </MotionForm>
  );
}
