import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Send, Trash2 } from 'lucide-react';
import type { Activity, Column, Label, Priority, Ticket, User } from '../lib/types';
import { useUsers } from '../hooks/useProjects';
import { useUpdateTicket, useDeleteTicket } from '../hooks/useTicketMutations';
import {
  useComments, useCreateComment, useActivity, useLabels, useTicketLabelMutations,
} from '../hooks/useTicketDetail';
import { useToast } from '../store/toast';
import { Avatar } from './Avatar';
import { LabelPicker } from './LabelPicker';
import { cn, timeAgo } from '../lib/utils';

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];
type Tab = 'comments' | 'activity';

const toDateInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');

interface Props {
  ticket: Ticket | null;
  boardId: number;
  projectId?: number;
  columns?: Column[];
  onClose: () => void;
}

// Turn an activity row + its meta into a human-readable phrase.
function describeActivity(a: Activity, columnsById: Map<number, string>, usersById: Map<number, string>): string {
  const meta = a.meta ?? {};
  switch (a.type) {
    case 'created':
      return 'created this ticket';
    case 'moved': {
      const from = columnsById.get(meta.from as number) ?? 'a column';
      const to = columnsById.get(meta.to as number) ?? 'a column';
      return `moved this from ${from} to ${to}`;
    }
    case 'assigned': {
      const id = meta.assigneeId as number | null;
      return id ? `assigned this to ${usersById.get(id) ?? 'someone'}` : 'unassigned this';
    }
    case 'commented':
      return 'commented';
    default:
      return a.type;
  }
}

export function TicketModal({ ticket, boardId, projectId, columns = [], onClose }: Props) {
  const { data: users } = useUsers();
  const { data: labels } = useLabels(projectId);
  const update = useUpdateTicket(boardId);
  const del = useDeleteTicket(boardId);
  const labelMut = useTicketLabelMutations(boardId);
  const { notify } = useToast();

  const [tab, setTab] = useState<Tab>('comments');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Draft (staged) state — the form only writes to the server when Save is pressed.
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [labelIds, setLabelIds] = useState<number[]>([]);

  const ticketId = ticket?.id ?? 0;
  const comments = useComments(ticketId);
  const createComment = useCreateComment(ticketId);
  const activity = useActivity(ticketId);
  const [commentBody, setCommentBody] = useState('');

  const columnsById = useMemo(() => new Map(columns.map((c) => [c.id, c.name])), [columns]);
  const usersById = useMemo(() => new Map((users ?? []).map((u: User) => [u.id, u.name])), [users]);
  const labelsById = useMemo(() => new Map(((labels as Label[]) ?? []).map((l) => [l.id, l])), [labels]);

  // Load the draft from the ticket whenever a different ticket opens.
  const resetDraft = (t: Ticket) => {
    setTitle(t.title);
    setDescription(t.description ?? '');
    setPriority(t.priority);
    setAssigneeId(t.assigneeId);
    setDueDate(toDateInput(t.dueDate));
    setLabelIds((t.Labels ?? []).map((l) => l.id));
  };
  useEffect(() => {
    if (ticket) {
      resetDraft(ticket);
      setTab('comments');
      setConfirmDelete(false);
    }
  }, [ticket?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saving = update.isPending || labelMut.add.isPending || labelMut.remove.isPending;

  // The draft's labels, resolved to {id,name,color} for the picker (project labels, then
  // falling back to whatever the ticket already carries).
  const draftLabels = useMemo(
    () => labelIds
      .map((id) => labelsById.get(id) ?? ticket?.Labels?.find((l) => l.id === id))
      .filter((l): l is Label => Boolean(l)),
    [labelIds, labelsById, ticket],
  );

  if (!ticket) return null;

  const origLabelIds = (ticket.Labels ?? []).map((l) => l.id);
  const labelsDirty =
    origLabelIds.length !== labelIds.length ||
    origLabelIds.some((id) => !labelIds.includes(id));

  // Which fields differ from the saved ticket?
  const dirty =
    title.trim() !== ticket.title ||
    description !== (ticket.description ?? '') ||
    priority !== ticket.priority ||
    assigneeId !== ticket.assigneeId ||
    dueDate !== toDateInput(ticket.dueDate) ||
    labelsDirty;
  const canSave = dirty && !!title.trim() && !saving;

  const save = async () => {
    if (!canSave) return;
    try {
      const data: Partial<Ticket> = {};
      if (title.trim() !== ticket.title) data.title = title.trim();
      if (description !== (ticket.description ?? '')) data.description = description;
      if (priority !== ticket.priority) data.priority = priority;
      if (assigneeId !== ticket.assigneeId) data.assigneeId = assigneeId;
      if (dueDate !== toDateInput(ticket.dueDate)) data.dueDate = dueDate ? new Date(dueDate).toISOString() : null;

      // Apply field changes first, then label add/remove — sequentially, so the board
      // cache patches don't race each other.
      if (Object.keys(data).length) await update.mutateAsync({ id: ticket.id, data });
      for (const id of labelIds.filter((id) => !origLabelIds.includes(id))) {
        await labelMut.add.mutateAsync({ ticketId: ticket.id, labelId: id });
      }
      for (const id of origLabelIds.filter((id) => !labelIds.includes(id))) {
        await labelMut.remove.mutateAsync({ ticketId: ticket.id, labelId: id });
      }
      notify('success', `Saved ${ticket.key}`);
    } catch {
      notify('error', 'Failed to save changes');
    }
  };

  const toggleLabel = (labelId: number, isAttached: boolean) =>
    setLabelIds((prev) => (isAttached ? prev.filter((id) => id !== labelId) : [...prev, labelId]));

  const handleDelete = () => {
    del.mutate(ticket.id, {
      onSuccess: () => { notify('success', `Deleted ${ticket.key}`); onClose(); },
      onError: () => notify('error', 'Failed to delete ticket'),
    });
  };

  const sendComment = () => {
    if (!commentBody.trim()) return;
    createComment.mutate(commentBody.trim());
    setCommentBody('');
  };

  return (
    <Dialog.Root open={!!ticket} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-3xl max-h-[88vh] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white dark:bg-slate-800 shadow-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
            <span className="text-sm font-mono text-slate-400">{ticket.key}</span>
            <Dialog.Close className="text-slate-400 hover:text-slate-600"><X size={18} /></Dialog.Close>
          </div>

          <div className="flex flex-col md:flex-row gap-6 p-5 overflow-y-auto">
            {/* Main */}
            <div className="flex-1 min-w-0">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-lg font-semibold bg-transparent text-slate-800 dark:text-slate-100 outline-none border-b border-transparent focus:border-blue-400 pb-1 mb-4"
              />

              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Add a description…"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 mb-5 resize-y"
              />

              <div className="flex border-b border-slate-200 dark:border-slate-700 mb-3">
                {(['comments', 'activity'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      'px-3 py-2 text-sm font-medium capitalize -mb-px border-b-2',
                      tab === t
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-600',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {tab === 'comments' && (
                <div>
                  <div className="flex gap-2 mb-4">
                    <input
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendComment()}
                      placeholder="Write a comment…"
                      className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
                    />
                    <button onClick={sendComment} disabled={!commentBody.trim()} className="px-3 rounded-lg bg-blue-600 text-white disabled:opacity-50">
                      <Send size={16} />
                    </button>
                  </div>
                  <ul className="space-y-3">
                    {comments.data?.map((c) => (
                      <li key={c.id} className="flex gap-2">
                        <Avatar user={c.author} size={28} />
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{c.author?.name}</span>
                            <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{c.body}</p>
                        </div>
                      </li>
                    ))}
                    {comments.data?.length === 0 && <p className="text-sm text-slate-400">No comments yet.</p>}
                  </ul>
                </div>
              )}

              {tab === 'activity' && (
                <ul className="space-y-2">
                  {activity.data?.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 text-sm">
                      <Avatar user={a.actor} size={22} />
                      <span className="text-slate-700 dark:text-slate-200 font-medium">{a.actor?.name ?? 'Someone'}</span>
                      <span className="text-slate-500 dark:text-slate-400">{describeActivity(a, columnsById, usersById)}</span>
                      <span className="text-xs text-slate-400 ml-auto shrink-0">{timeAgo(a.createdAt)}</span>
                    </li>
                  ))}
                  {activity.data?.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
                </ul>
              )}
            </div>

            {/* Sidebar */}
            <div className="w-full md:w-56 shrink-0 space-y-4">
              <Field label="Assignee">
                <select
                  value={assigneeId ?? ''}
                  onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-2 py-1.5 text-sm text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="" className="dark:bg-slate-800">Unassigned</option>
                  {users?.map((u) => <option key={u.id} value={u.id} className="dark:bg-slate-800">{u.name}</option>)}
                </select>
              </Field>

              <Field label="Priority">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-2 py-1.5 text-sm text-slate-700 dark:text-slate-200 outline-none capitalize"
                >
                  {PRIORITIES.map((p) => <option key={p} value={p} className="dark:bg-slate-800 capitalize">{p}</option>)}
                </select>
              </Field>

              <Field label="Due date">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-2 py-1.5 text-sm text-slate-700 dark:text-slate-200 outline-none"
                />
              </Field>

              <Field label="Labels">
                <LabelPicker
                  all={(labels as Label[]) ?? []}
                  attached={draftLabels}
                  onToggle={(label, isAttached) => toggleLabel(label.id, isAttached)}
                />
              </Field>

              <Field label="Reporter">
                <div className="flex items-center gap-2">
                  <Avatar user={ticket.reporter} size={24} />
                  <span className="text-sm text-slate-700 dark:text-slate-200">{ticket.reporter?.name ?? 'Unknown'}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Set when the ticket was created</p>
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
            {/* Delete (soft) — left side, with an inline confirm step */}
            <div>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 size={15} /> Delete
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Delete {ticket.key}?</span>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={del.isPending}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {del.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              )}
            </div>

            {/* Discard / Save — right side */}
            <div className="flex items-center gap-2">
              {dirty && (
                <button
                  onClick={() => resetDraft(ticket)}
                  disabled={saving}
                  className="px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  Discard
                </button>
              )}
              <button
                onClick={save}
                disabled={!canSave}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
