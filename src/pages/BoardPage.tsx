import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { BoardView } from '../components/BoardView';
import { FiltersBar, EMPTY_FILTERS, type Filters } from '../components/FiltersBar';
import { NewTicketDialog, type NewTicketValues } from '../components/NewTicketDialog';
import { TicketModal } from '../components/TicketModal';
import { useBoard } from '../hooks/useBoard';
import { useBoardRealtime } from '../hooks/useBoardRealtime';
import { useMoveTicket, useCreateTicket } from '../hooks/useTicketMutations';
import { useUsers } from '../hooks/useProjects';
import { useLabels } from '../hooks/useTicketDetail';
import { useToast } from '../store/toast';
import type { Ticket } from '../lib/types';

function applyFilters(tickets: Ticket[], f: Filters): Ticket[] {
  const q = f.q.trim().toLowerCase();
  return tickets.filter((t) => {
    if (q && !t.title.toLowerCase().includes(q) && !t.key.toLowerCase().includes(q)) return false;
    if (f.assigneeId && t.assigneeId !== f.assigneeId) return false;
    if (f.priority && t.priority !== f.priority) return false;
    if (f.labelId && !(t.Labels ?? []).some((l) => l.id === f.labelId)) return false;
    return true;
  });
}

export function BoardPage() {
  const { boardId: boardIdParam } = useParams();
  const boardId = Number(boardIdParam);

  const { data, isLoading, isError } = useBoard(boardId);
  useBoardRealtime(boardId);
  const move = useMoveTicket(boardId);
  const create = useCreateTicket(boardId);
  const { notify } = useToast();

  const { data: users } = useUsers();
  const { data: labels } = useLabels(data?.board.projectId);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [dialogColumn, setDialogColumn] = useState<number | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const columnName = data?.columns.find((c) => c.id === dialogColumn)?.name;
  const selectedTicket = data?.tickets.find((t) => t.id === selectedTicketId) ?? null;

  const filtered = useMemo(
    () => (data ? applyFilters(data.tickets, filters) : []),
    [data, filters],
  );
  const filtering = filters.q || filters.assigneeId || filters.priority || filters.labelId;

  const handleCreate = (values: NewTicketValues) => {
    if (dialogColumn == null || !data) return;
    create.mutate(
      { boardId, columnId: dialogColumn, title: values.title, priority: values.priority, assigneeId: values.assigneeId },
      {
        onSuccess: (t) => notify('success', `Created ${t.key}`),
        onError: () => notify('error', 'Failed to create ticket'),
      },
    );
  };

  const handleMove = (id: number, columnId: number, position: number) => {
    move.mutate({ id, columnId, position }, {
      onError: () => notify('error', 'Move failed — reverted'),
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <Header
        subtitle={data
          ? `${data.project ? `${data.project.name} (${data.project.key}) · ` : ''}${data.board.name}`
          : undefined}
      />
      {data && (
        <FiltersBar
          filters={filters}
          users={users ?? []}
          labels={labels ?? []}
          matched={filtered.length}
          total={data.tickets.length}
          onChange={setFilters}
        />
      )}
      <main className="flex-1 min-h-0">
        {isLoading && <p className="p-6 text-slate-400">Loading board…</p>}
        {isError && <p className="p-6 text-red-500">Failed to load board {boardId}.</p>}
        {data && (
          <BoardView
            columns={data.columns}
            tickets={filtered}
            dragDisabled={!!filtering}
            onMove={handleMove}
            onAddTicket={(columnId) => setDialogColumn(columnId)}
            onOpenTicket={(t) => setSelectedTicketId(t.id)}
          />
        )}
      </main>

      <NewTicketDialog
        open={dialogColumn != null}
        columnName={columnName}
        onOpenChange={(o) => !o && setDialogColumn(null)}
        onCreate={handleCreate}
      />

      <TicketModal
        ticket={selectedTicket}
        boardId={boardId}
        projectId={data?.board.projectId}
        columns={data?.columns ?? []}
        onClose={() => setSelectedTicketId(null)}
      />
    </div>
  );
}
