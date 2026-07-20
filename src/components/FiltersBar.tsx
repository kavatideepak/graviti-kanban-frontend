import { Search, X } from 'lucide-react';
import type { Label, Priority, User } from '../lib/types';

export interface Filters {
  q: string;
  assigneeId: number | null;
  priority: Priority | '';
  labelId: number | null;
}

export const EMPTY_FILTERS: Filters = { q: '', assigneeId: null, priority: '', labelId: null };

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

interface Props {
  filters: Filters;
  users: User[];
  labels: Label[];
  matched: number;
  total: number;
  onChange: (f: Filters) => void;
}

export function FiltersBar({ filters, users, labels, matched, total, onChange }: Props) {
  const active = filters.q || filters.assigneeId || filters.priority || filters.labelId;
  const sel = 'rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-700 dark:text-slate-200 outline-none';

  // Selects stretch to fill the row on small screens, snap to natural width from sm up.
  const selResponsive = `${sel} flex-1 sm:flex-none min-w-[7.5rem]`;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="relative w-full sm:w-auto">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Search title or key…"
          className={`${sel} pl-8 w-full sm:w-56`}
        />
      </div>

      <select value={filters.assigneeId ?? ''} onChange={(e) => onChange({ ...filters, assigneeId: e.target.value ? Number(e.target.value) : null })} className={selResponsive}>
        <option value="">All assignees</option>
        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>

      <select value={filters.priority} onChange={(e) => onChange({ ...filters, priority: e.target.value as Priority | '' })} className={`${selResponsive} capitalize`}>
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
      </select>

      <select value={filters.labelId ?? ''} onChange={(e) => onChange({ ...filters, labelId: e.target.value ? Number(e.target.value) : null })} className={selResponsive}>
        <option value="">All labels</option>
        {labels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>

      {active && (
        <button onClick={() => onChange(EMPTY_FILTERS)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5 shrink-0">
          <X size={14} /> Clear
        </button>
      )}
      {active && <span className="text-xs text-slate-400 ml-auto shrink-0">{matched} / {total} tickets</span>}
    </div>
  );
}
