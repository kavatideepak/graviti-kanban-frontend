import { initials } from '../lib/utils';
import type { UserLite } from '../lib/types';

export function Avatar({ user, size = 28 }: { user?: UserLite | null; size?: number }) {
  if (!user) {
    return (
      <div
        className="rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        title="Unassigned"
      >
        ?
      </div>
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-medium"
      style={{ width: size, height: size, backgroundColor: user.avatarColor, fontSize: size * 0.38 }}
      title={user.name}
    >
      {initials(user.name)}
    </div>
  );
}
