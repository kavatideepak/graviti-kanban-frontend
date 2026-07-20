import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Column, Ticket } from '../lib/types';
import { TicketCard } from './TicketCard';
import { cn } from '../lib/utils';

interface Props {
  column: Column;
  tickets: Ticket[];
  dragDisabled?: boolean;
  onAddTicket: (columnId: number) => void;
  onOpenTicket: (ticket: Ticket) => void;
}

export function ColumnView({ column, tickets, dragDisabled = false, onAddTicket, onOpenTicket }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${column.id}`, data: { type: 'column', columnId: column.id } });
  const overLimit = column.wipLimit != null && tickets.length > column.wipLimit;

  return (
    <div className="flex flex-col w-72 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-900/60 max-h-full">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{column.name}</h3>
          <span
            className={cn(
              'text-xs px-1.5 rounded-full',
              overLimit
                ? 'bg-red-500 text-white'
                : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
            )}
            title={column.wipLimit != null ? `WIP limit: ${column.wipLimit}` : undefined}
          >
            {tickets.length}{column.wipLimit != null ? `/${column.wipLimit}` : ''}
          </span>
        </div>
        <button
          onClick={() => onAddTicket(column.id)}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
          title="Add ticket"
        >
          <Plus size={16} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-24 rounded-b-xl transition-colors',
          isOver && 'bg-blue-50 dark:bg-blue-950/30',
        )}
      >
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} dragDisabled={dragDisabled} onOpen={onOpenTicket} />
          ))}
        </SortableContext>
        {tickets.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6 select-none">Drop tickets here</p>
        )}
      </div>
    </div>
  );
}
