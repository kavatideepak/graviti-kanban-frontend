import type { Priority } from '../lib/types';
import { cn } from '../lib/utils';

const STYLES: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide', STYLES[priority])}>
      {priority}
    </span>
  );
}
