import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { Priority } from '../lib/types';
import { useUsers } from '../hooks/useProjects';

export interface NewTicketValues {
  title: string;
  priority: Priority;
  assigneeId: number | null;
}

interface Props {
  open: boolean;
  columnName?: string;
  onOpenChange: (open: boolean) => void;
  onCreate: (values: NewTicketValues) => void;
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

export function NewTicketDialog({ open, columnName, onOpenChange, onCreate }: Props) {
  const { data: users } = useUsers();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assigneeId, setAssigneeId] = useState<number | null>(null);

  const submit = () => {
    if (!title.trim()) return;
    onCreate({ title: title.trim(), priority, assigneeId });
    setTitle('');
    setPriority('medium');
    setAssigneeId(null);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white dark:bg-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              New ticket{columnName ? ` in ${columnName}` : ''}
            </Dialog.Title>
            <Dialog.Close className="text-slate-400 hover:text-slate-600"><X size={18} /></Dialog.Close>
          </div>

          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Title</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="What needs doing?"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-400 mb-4"
          />

          <div className="flex gap-3 mb-5">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none"
              >
                {PRIORITIES.map((p) => <option key={p} value={p} className="dark:bg-slate-800">{p}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Assignee</label>
              <select
                value={assigneeId ?? ''}
                onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="" className="dark:bg-slate-800">Unassigned</option>
                {users?.map((u) => <option key={u.id} value={u.id} className="dark:bg-slate-800">{u.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Dialog.Close className="px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
              Cancel
            </Dialog.Close>
            <button
              onClick={submit}
              disabled={!title.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
