import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProject, updateProject, getProjects, getUsers } from '../api/endpoints';

export function useProjects() {
  return useQuery({ queryKey: ['projects'], queryFn: getProjects });
}

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: getUsers });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: number; data: { name?: string; description?: string } }) =>
      updateProject(vars.id, vars.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
