import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getComments, createComment, getActivity, getLabels,
  addLabelToTicket, removeLabelFromTicket,
} from '../api/endpoints';
import { boardKey } from './useBoard';
import { useSocket } from '../socket/SocketProvider';
import type { BoardFull, Ticket } from '../lib/types';

export function useComments(ticketId: number) {
  const qc = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: ['comments', ticketId],
    queryFn: () => getComments(ticketId),
    enabled: !!ticketId,
  });

  // Live comments: refresh this ticket's thread when the server broadcasts.
  useEffect(() => {
    if (!socket) return;
    const onChange = (p: { ticketId: number }) => {
      if (p.ticketId === ticketId) qc.invalidateQueries({ queryKey: ['comments', ticketId] });
    };
    socket.on('comment:created', onChange);
    socket.on('comment:deleted', onChange);
    return () => {
      socket.off('comment:created', onChange);
      socket.off('comment:deleted', onChange);
    };
  }, [socket, ticketId, qc]);

  return query;
}

export function useCreateComment(ticketId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => createComment(ticketId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', ticketId] }),
  });
}

export function useActivity(ticketId: number) {
  const qc = useQueryClient();
  const socket = useSocket();

  // Always fetch while the modal is open (like comments) so socket-driven refreshes
  // land on an active query — gating by tab left the feed stale after edits.
  const query = useQuery({
    queryKey: ['activity', ticketId],
    queryFn: () => getActivity(ticketId),
    enabled: !!ticketId,
  });

  // Activity rows are written server-side on move/update/assign/comment. Refresh the
  // feed when any of those broadcasts land for this ticket (ticket events carry the
  // full entity → match on .id; comment events carry .ticketId).
  useEffect(() => {
    if (!socket) return;
    const invalidate = () => qc.invalidateQueries({ queryKey: ['activity', ticketId], refetchType: 'all' });
    const onTicket = (t: { id?: number }) => { if (t?.id === ticketId) invalidate(); };
    const onComment = (p: { ticketId?: number }) => { if (p?.ticketId === ticketId) invalidate(); };
    socket.on('ticket:moved', onTicket);
    socket.on('ticket:updated', onTicket);
    socket.on('comment:created', onComment);
    socket.on('comment:deleted', onComment);
    return () => {
      socket.off('ticket:moved', onTicket);
      socket.off('ticket:updated', onTicket);
      socket.off('comment:created', onComment);
      socket.off('comment:deleted', onComment);
    };
  }, [socket, ticketId, qc]);

  return query;
}

export function useLabels(projectId?: number) {
  return useQuery({
    queryKey: ['labels', projectId],
    queryFn: () => getLabels(projectId as number),
    enabled: !!projectId,
  });
}

// Attaching/detaching returns the full ticket; patch it into the board cache.
export function useTicketLabelMutations(boardId: number) {
  const qc = useQueryClient();
  const patch = (updated: Ticket) => {
    qc.setQueryData<BoardFull>(boardKey(boardId), (b) =>
      b ? { ...b, tickets: b.tickets.map((t) => (t.id === updated.id ? updated : t)) } : b);
  };

  const add = useMutation({
    mutationFn: (v: { ticketId: number; labelId: number }) => addLabelToTicket(v.ticketId, v.labelId),
    onSuccess: patch,
  });
  const remove = useMutation({
    mutationFn: (v: { ticketId: number; labelId: number }) => removeLabelFromTicket(v.ticketId, v.labelId),
    onSuccess: patch,
  });
  return { add, remove };
}
