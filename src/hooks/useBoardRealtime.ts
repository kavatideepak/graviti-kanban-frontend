import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../socket/SocketProvider';
import { boardKey } from './useBoard';
import type { BoardFull, Column, Ticket } from '../lib/types';

// Join the board's room and patch the react-query cache as events arrive,
// so every open window stays in sync without polling.
export function useBoardRealtime(boardId: number) {
  const socket = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return;
    const key = boardKey(boardId);

    const patch = (fn: (prev: BoardFull) => BoardFull) => {
      qc.setQueryData<BoardFull>(key, (prev) => (prev ? fn(prev) : prev));
    };

    const upsertTicket = (t: Ticket) => patch((prev) => {
      if (t.boardId !== boardId) return prev;
      const others = prev.tickets.filter((x) => x.id !== t.id);
      return { ...prev, tickets: [...others, t] };
    });
    const removeTicket = (p: { id: number }) => patch((prev) => ({
      ...prev, tickets: prev.tickets.filter((x) => x.id !== p.id),
    }));
    const upsertColumn = (c: Column) => patch((prev) => {
      if (c.boardId !== boardId) return prev;
      const others = prev.columns.filter((x) => x.id !== c.id);
      return { ...prev, columns: [...others, c].sort((a, b) => a.position - b.position) };
    });
    const removeColumn = (p: { id: number }) => patch((prev) => ({
      ...prev, columns: prev.columns.filter((x) => x.id !== p.id),
    }));

    socket.emit('board:join', boardId);
    socket.on('ticket:created', upsertTicket);
    socket.on('ticket:updated', upsertTicket);
    socket.on('ticket:moved', upsertTicket);
    socket.on('ticket:deleted', removeTicket);
    socket.on('column:created', upsertColumn);
    socket.on('column:updated', upsertColumn);
    socket.on('column:deleted', removeColumn);

    return () => {
      socket.emit('board:leave', boardId);
      socket.off('ticket:created', upsertTicket);
      socket.off('ticket:updated', upsertTicket);
      socket.off('ticket:moved', upsertTicket);
      socket.off('ticket:deleted', removeTicket);
      socket.off('column:created', upsertColumn);
      socket.off('column:updated', upsertColumn);
      socket.off('column:deleted', removeColumn);
    };
  }, [socket, boardId, qc]);
}
