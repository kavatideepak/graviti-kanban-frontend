import { Link } from 'react-router-dom';
import { LayoutGrid, Sun, Moon } from 'lucide-react';
import { UserSwitcher } from './UserSwitcher';
import { useTheme } from '../store/theme';

export function Header({ subtitle }: { subtitle?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <header className="flex items-center justify-between gap-2 px-4 h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <Link to="/" className="flex items-center gap-2 shrink-0 text-slate-800 dark:text-slate-100">
          <LayoutGrid size={20} className="text-blue-500" />
          {/* Hide the wordmark on phones when a subtitle needs the room; keep it on the Projects page */}
          <span className={`font-bold ${subtitle ? 'hidden sm:inline' : 'inline'}`}>Graviti Kanban</span>
        </Link>
        {subtitle && <span className="text-slate-300 dark:text-slate-600 shrink-0">/</span>}
        {subtitle && <span className="text-sm text-slate-500 dark:text-slate-400 truncate min-w-0">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <UserSwitcher />
      </div>
    </header>
  );
}
