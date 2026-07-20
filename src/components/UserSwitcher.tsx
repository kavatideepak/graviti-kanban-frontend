import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Check } from 'lucide-react';
import { useUsers } from '../hooks/useProjects';
import { useCurrentUserId } from '../store/user';
import { Avatar } from './Avatar';

export function UserSwitcher() {
  const { data: users } = useUsers();
  const { userId, setUserId } = useCurrentUserId();
  const current = users?.find((u) => u.id === userId);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 outline-none">
        <Avatar user={current} size={26} />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:inline">
          {current?.name ?? 'Pick user'}
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-52 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-1"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs text-slate-400">Acting as</DropdownMenu.Label>
          {users?.map((u) => (
            <DropdownMenu.Item
              key={u.id}
              onSelect={() => setUserId(u.id)}
              className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-slate-700 dark:text-slate-200 outline-none cursor-pointer data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-700"
            >
              <Avatar user={u} size={24} />
              <span className="flex-1">{u.name}</span>
              {u.id === userId && <Check size={14} className="text-blue-500" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
