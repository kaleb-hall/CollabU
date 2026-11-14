import { cx } from '../../lib/cx';

// A placeholder block shown while content loads (pulses unless reduced motion is on)
export default function Skeleton({ className }) {
  return <div aria-hidden="true" className={cx('animate-pulse rounded-card bg-paper-deep', className)} />;
}
