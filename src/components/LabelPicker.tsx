import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Tag, Plus, Check } from 'lucide-react';
import type { Label, LabelLite } from '../lib/types';

interface Props {
  all: Label[];
  attached: LabelLite[];
  onToggle: (label: Label, isAttached: boolean) => void;
}

export function LabelPicker({ all, attached, onToggle }: Props) {
  const attachedIds = new Set(attached.map((l) => l.id));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {attached.map((l) => (
        <span key={l.id} className="text-[11px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: l.color }}>
          {l.name}
        </span>
      ))}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="inline-flex items-center gap-1 text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-600 rounded-full px-2 py-0.5 hover:border-slate-400 outline-none">
          {attached.length === 0 ? <><Tag size={12} /> Add label</> : <Plus size={12} />}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={6}
            className="z-[60] min-w-44 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-1"
          >
            {all.length === 0 && <p className="px-2 py-1.5 text-xs text-slate-400">No labels yet</p>}
            {all.map((l) => {
              const isAttached = attachedIds.has(l.id);
              return (
                <DropdownMenu.Item
                  key={l.id}
                  onSelect={(e) => { e.preventDefault(); onToggle(l, isAttached); }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-sm outline-none cursor-pointer data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-700"
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="flex-1 text-slate-700 dark:text-slate-200">{l.name}</span>
                  {isAttached && <Check size={14} className="text-blue-500" />}
                </DropdownMenu.Item>
              );
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
