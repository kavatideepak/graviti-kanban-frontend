import { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarClock } from 'lucide-react';
import type { Ticket } from '../lib/types';
import { Avatar } from './Avatar';
import { PriorityBadge } from './PriorityBadge';
import { cn, formatDueDate, isOverdue } from '../lib/utils';

interface Props {
  ticket: Ticket;
  overlay?: boolean;
  dragDisabled?: boolean;
  onOpen?: (ticket: Ticket) => void;
}

export function TicketCard({ ticket, overlay = false, dragDisabled = false, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
    data: { type: 'ticket', ticket },
    disabled: dragDisabled,
  });
  const downPos = useRef<{ x: number; y: number } | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDownCapture={(e) => { downPos.current = { x: e.clientX, y: e.clientY }; }}
      onClick={(e) => {
        // Only treat as a click (open modal) if the pointer barely moved — a real drag moves more.
        const d = downPos.current;
        if (!overlay && onOpen && d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5) {
          onOpen(ticket);
        }
      }}
      className={cn(
        'rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        'p-3 shadow-sm cursor-grab active:cursor-grabbing select-none',
        'hover:border-slate-300 dark:hover:border-slate-600 transition-colors',
        isDragging && !overlay && 'opacity-40',
        overlay && 'shadow-lg ring-2 ring-blue-400/50 rotate-2',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-mono text-slate-400">{ticket.key}</span>
        <PriorityBadge priority={ticket.priority} />
      </div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">{ticket.title}</p>
      {ticket.Labels && ticket.Labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {ticket.Labels.map((l) => (
            <span key={l.id} className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: l.color }}>
              {l.name}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-2">
        {ticket.dueDate ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded',
              isOverdue(ticket.dueDate)
                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                : 'text-slate-500 dark:text-slate-400',
            )}
            title={isOverdue(ticket.dueDate) ? 'Overdue' : 'Due date'}
          >
            <CalendarClock size={12} />
            {formatDueDate(ticket.dueDate)}
          </span>
        ) : <span />}
        <Avatar user={ticket.assignee} size={24} />
      </div>
    </div>
  );
}
