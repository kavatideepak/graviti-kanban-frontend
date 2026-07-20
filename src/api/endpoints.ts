import { api } from './client';
import type {
  BoardFull, Project, Ticket, User, Priority, Comment, Activity, Label,
} from '../lib/types';

export const getUsers = () => api.get<User[]>('/users').then((r) => r.data);

export const getProjects = () => api.get<Project[]>('/projects').then((r) => r.data);

export const createProject = (data: { key: string; name: string; description?: string }) =>
  api.post<Project>('/projects', data).then((r) => r.data);

export const updateProject = (id: number, data: { name?: string; description?: string }) =>
  api.patch<Project>(`/projects/${id}`, data).then((r) => r.data);

export const getBoardFull = (boardId: number) =>
  api.get<BoardFull>(`/boards/${boardId}/full`).then((r) => r.data);

export interface CreateTicketInput {
  boardId: number;
  columnId: number;
  title: string;
  description?: string;
  priority?: Priority;
  assigneeId?: number | null;
}

export const createTicket = (data: CreateTicketInput) =>
  api.post<Ticket>('/tickets', data).then((r) => r.data);

export const moveTicket = (id: number, data: { columnId: number; position: number }) =>
  api.patch<Ticket>(`/tickets/${id}/move`, data).then((r) => r.data);

export const updateTicket = (id: number, data: Partial<Ticket>) =>
  api.patch<Ticket>(`/tickets/${id}`, data).then((r) => r.data);

export const deleteTicket = (id: number) => api.delete(`/tickets/${id}`).then((r) => r.data);

// Comments
export const getComments = (ticketId: number) =>
  api.get<Comment[]>(`/tickets/${ticketId}/comments`).then((r) => r.data);

export const createComment = (ticketId: number, body: string) =>
  api.post<Comment>(`/tickets/${ticketId}/comments`, { body }).then((r) => r.data);

export const deleteComment = (id: number) => api.delete(`/comments/${id}`).then((r) => r.data);

// Activity
export const getActivity = (ticketId: number) =>
  api.get<Activity[]>(`/tickets/${ticketId}/activity`).then((r) => r.data);

// Labels
export const getLabels = (projectId: number) =>
  api.get<Label[]>('/labels', { params: { projectId } }).then((r) => r.data);

export const createLabel = (data: { projectId: number; name: string; color?: string }) =>
  api.post<Label>('/labels', data).then((r) => r.data);

export const addLabelToTicket = (ticketId: number, labelId: number) =>
  api.post<Ticket>(`/tickets/${ticketId}/labels`, { labelId }).then((r) => r.data);

export const removeLabelFromTicket = (ticketId: number, labelId: number) =>
  api.delete<Ticket>(`/tickets/${ticketId}/labels/${labelId}`).then((r) => r.data);
