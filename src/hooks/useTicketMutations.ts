import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTicket, moveTicket, updateTicket, deleteTicket, type CreateTicketInput } from '../api/endpoints';
import { boardKey } from './useBoard';
import type { BoardFull, Ticket } from '../lib/types';

export function useMoveTicket(boardId: number) {
  const qc = useQueryClient();
  const key = boardKey(boardId);

  return useMutation({
    mutationFn: (vars: { id: number; columnId: number; position: number }) =>
      moveTicket(vars.id, { columnId: vars.columnId, position: vars.position }),

    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BoardFull>(key);
      qc.setQueryData<BoardFull>(key, (b) => {
        if (!b) return b;
        return {
          ...b,
          tickets: b.tickets.map((t) =>
            t.id === vars.id ? { ...t, columnId: vars.columnId, position: vars.position } : t,
          ),
        };
      });
      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },

    onSuccess: (server: Ticket) => {
      qc.setQueryData<BoardFull>(key, (b) => {
        if (!b) return b;
        return { ...b, tickets: b.tickets.map((t) => (t.id === server.id ? server : t)) };
      });
    },
  });
}

export function useCreateTicket(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketInput) => createTicket(input),
    onSuccess: (created) => {
      qc.setQueryData<BoardFull>(boardKey(boardId), (b) => {
        if (!b) return b;
        if (b.tickets.some((t) => t.id === created.id)) return b;
        return { ...b, tickets: [...b.tickets, created] };
      });
    },
  });
}

export function useDeleteTicket(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTicket(id),
    onSuccess: (_res, id) => {
      // Remove immediately; the ticket:deleted broadcast keeps other windows in sync.
      qc.setQueryData<BoardFull>(boardKey(boardId), (b) =>
        b ? { ...b, tickets: b.tickets.filter((t) => t.id !== id) } : b);
    },
  });
}

export function useUpdateTicket(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; data: Partial<Ticket> }) => updateTicket(vars.id, vars.data),
    onSuccess: (updated) => {
      qc.setQueryData<BoardFull>(boardKey(boardId), (b) => {
        if (!b) return b;
        return { ...b, tickets: b.tickets.map((t) => (t.id === updated.id ? updated : t)) };
      });
    },
  });
}
