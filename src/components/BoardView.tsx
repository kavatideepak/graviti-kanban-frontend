import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Column, Ticket } from '../lib/types';
import { ColumnView } from './ColumnView';
import { TicketCard } from './TicketCard';
import { between } from '../lib/utils';

type Grouped = Record<number, Ticket[]>;

function group(columns: Column[], tickets: Ticket[]): Grouped {
  const g: Grouped = {};
  for (const c of columns) g[c.id] = [];
  for (const t of tickets) {
    (g[t.columnId] ||= []).push(t);
  }
  for (const id of Object.keys(g)) {
    g[Number(id)].sort((a, b) => a.position - b.position);
  }
  return g;
}

// Include every field the card renders (not just position), so an edit to
// priority / title / assignee / labels / due date re-syncs the board — not only moves.
function signature(tickets: Ticket[]): string {
  return tickets
    .map((t) =>
      [
        t.id,
        t.columnId,
        t.position,
        t.priority,
        t.title,
        t.assignee?.id ?? t.assigneeId ?? '',
        t.dueDate ?? '',
        (t.Labels ?? []).map((l) => `${l.id}:${l.color}:${l.name}`).join(','),
      ].join('~'),
    )
    .sort()
    .join('|');
}

interface Props {
  columns: Column[];
  tickets: Ticket[];
  dragDisabled?: boolean;
  onMove: (id: number, columnId: number, position: number) => void;
  onAddTicket: (columnId: number) => void;
  onOpenTicket: (ticket: Ticket) => void;
}

export function BoardView({ columns, tickets, dragDisabled = false, onMove, onAddTicket, onOpenTicket }: Props) {
  const [local, setLocal] = useState<Grouped>(() => group(columns, tickets));
  const [activeId, setActiveId] = useState<number | null>(null);
  const draggingRef = useRef(false);

  // Re-sync from server data whenever it changes and we're not mid-drag.
  const sig = useMemo(() => signature(tickets), [tickets]);
  useEffect(() => {
    if (!draggingRef.current) setLocal(group(columns, tickets));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, columns.length]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeTicket = activeId != null
    ? Object.values(local).flat().find((t) => t.id === activeId) ?? null
    : null;

  const columnOfTicket = (id: number): number | null => {
    for (const [cid, arr] of Object.entries(local)) {
      if (arr.some((t) => t.id === id)) return Number(cid);
    }
    return null;
  };

  const columnOfOver = (overId: string | number): number | null => {
    if (typeof overId === 'string' && overId.startsWith('column-')) {
      return Number(overId.slice('column-'.length));
    }
    return columnOfTicket(Number(overId));
  };

  const onDragStart = (e: DragStartEvent) => {
    if (dragDisabled) return;
    draggingRef.current = true;
    setActiveId(Number(e.active.id));
  };

  const onDragOver = (e: DragOverEvent) => {
    if (dragDisabled) return;
    const { active, over } = e;
    if (!over) return;
    const activeCol = columnOfTicket(Number(active.id));
    const overCol = columnOfOver(over.id);
    if (activeCol == null || overCol == null || activeCol === overCol) return;

    setLocal((prev) => {
      const next: Grouped = { ...prev };
      const from = [...next[activeCol]];
      const to = [...next[overCol]];
      const movingIdx = from.findIndex((t) => t.id === Number(active.id));
      if (movingIdx === -1) return prev;
      const [moving] = from.splice(movingIdx, 1);

      // Insert before the ticket we're hovering, or append if over the column body.
      let insertAt = to.length;
      const overIdx = to.findIndex((t) => t.id === Number(over.id));
      if (overIdx !== -1) insertAt = overIdx;

      to.splice(insertAt, 0, { ...moving, columnId: overCol });
      next[activeCol] = from;
      next[overCol] = to;
      return next;
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (dragDisabled) return;
    const { active, over } = e;
    draggingRef.current = false;
    setActiveId(null);
    if (!over) return;

    const activeCol = columnOfTicket(Number(active.id));
    const overCol = columnOfOver(over.id);
    if (activeCol == null || overCol == null) return;

    setLocal((prev) => {
      const next: Grouped = { ...prev };
      const arr = [...next[overCol]];
      const oldIndex = arr.findIndex((t) => t.id === Number(active.id));
      let newIndex = oldIndex;
      const overIdx = arr.findIndex((t) => t.id === Number(over.id));
      if (overIdx !== -1) newIndex = overIdx;

      const reordered = oldIndex === newIndex ? arr : arrayMove(arr, oldIndex, newIndex);
      next[overCol] = reordered;

      // Compute a fractional position from the settled neighbors.
      const idx = reordered.findIndex((t) => t.id === Number(active.id));
      const prevPos = idx > 0 ? reordered[idx - 1].position : undefined;
      const nextPos = idx < reordered.length - 1 ? reordered[idx + 1].position : undefined;
      const position = between(prevPos, nextPos);
      reordered[idx] = { ...reordered[idx], columnId: overCol, position };

      onMove(Number(active.id), overCol, position);
      return next;
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => { draggingRef.current = false; setActiveId(null); }}
    >
      <div className="flex gap-4 h-full overflow-x-auto p-4">
        {columns.map((c) => (
          <ColumnView key={c.id} column={c} tickets={local[c.id] ?? []} dragDisabled={dragDisabled} onAddTicket={onAddTicket} onOpenTicket={onOpenTicket} />
        ))}
      </div>
      <DragOverlay>{activeTicket ? <TicketCard ticket={activeTicket} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
