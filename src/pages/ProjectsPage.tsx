import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, FolderKanban, X, Pencil } from 'lucide-react';
import { Header } from '../components/Header';
import { useProjects, useCreateProject, useUpdateProject } from '../hooks/useProjects';
import type { Project } from '../lib/types';

export function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const create = useCreateProject();
  const updateProject = useUpdateProject();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null); // null = create mode
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const openCreate = () => {
    setEditingId(null); setKey(''); setName(''); setDesc(''); setOpen(true);
  };
  const openEdit = (p: Project) => {
    setEditingId(p.id); setKey(p.key); setName(p.name); setDesc(p.description ?? ''); setOpen(true);
  };

  const openProject = (boardId?: number) => {
    if (boardId) navigate(`/boards/${boardId}`);
  };

  const busy = create.isPending || updateProject.isPending;

  const submit = async () => {
    if (!name.trim() || busy) return;
    if (editingId != null) {
      await updateProject.mutateAsync({ id: editingId, data: { name: name.trim(), description: desc.trim() } });
      setOpen(false);
      return;
    }
    if (!key.trim()) return;
    const project = await create.mutateAsync({
      key: key.trim().toUpperCase(), name: name.trim(), description: desc.trim() || undefined,
    });
    setOpen(false);
    const boardId = project.Boards?.[0]?.id;
    if (boardId) navigate(`/boards/${boardId}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Projects</h1>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={16} /> New project
            </button>
          </div>

          {isLoading ? (
            <p className="text-slate-400">Loading…</p>
          ) : projects && projects.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <FolderKanban size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No projects yet.</p>
              <button onClick={openCreate} className="mt-3 text-sm font-medium text-blue-600 hover:underline">
                Create your first project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects?.map((p) => {
                const board = p.Boards?.[0];
                return (
                  <div
                    key={p.id}
                    onClick={() => openProject(board?.id)}
                    className={`group relative text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition ${
                      board ? 'cursor-pointer hover:border-blue-300 hover:shadow-md' : 'opacity-60'
                    }`}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition"
                      title="Edit project"
                    >
                      <Pencil size={15} />
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <FolderKanban size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-xs font-mono text-slate-400">{p.key}</span>
                    </div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</h3>
                    {p.description
                      ? <p title={p.description} className="text-sm text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                      : <p className="text-sm text-slate-400 italic mt-1">No description</p>}
                    <p className="text-xs text-slate-400 mt-3">{board ? board.name : 'No board yet'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white dark:bg-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {editingId != null ? 'Edit project' : 'New project'}
              </Dialog.Title>
              <Dialog.Close className="text-slate-400 hover:text-slate-600"><X size={18} /></Dialog.Close>
            </div>

            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Key (e.g. PROJ)</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              maxLength={10}
              disabled={editingId != null}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-400 mb-3 font-mono disabled:opacity-50"
            />

            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-400 mb-3"
            />

            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="What is this project about? (optional)"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-400 mb-4 resize-y"
            />

            {editingId == null && (
              <p className="text-xs text-slate-400 mb-4">A board with default columns (To Do · In Progress · Review · Done) is created automatically.</p>
            )}

            <div className="flex justify-end gap-2">
              <Dialog.Close className="px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</Dialog.Close>
              <button
                onClick={submit}
                disabled={!name.trim() || (editingId == null && !key.trim()) || busy}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {busy ? 'Saving…' : editingId != null ? 'Save' : 'Create'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
