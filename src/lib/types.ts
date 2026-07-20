export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: number;
  name: string;
  email: string;
  avatarColor: string;
  role: string;
}

export interface UserLite {
  id: number;
  name: string;
  avatarColor: string;
}

export interface LabelLite {
  id: number;
  name: string;
  color: string;
}

export interface Project {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  ticketSeq: number;
  Boards?: { id: number; name: string; position: number }[];
}

export interface Column {
  id: number;
  boardId: number;
  name: string;
  position: number;
  wipLimit: number | null;
}

export interface Board {
  id: number;
  projectId: number;
  name: string;
  position: number;
}

export interface Ticket {
  id: number;
  boardId: number;
  columnId: number;
  key: string;
  title: string;
  description?: string | null;
  priority: Priority;
  assigneeId: number | null;
  reporterId: number | null;
  dueDate: string | null;
  position: number;
  assignee?: UserLite | null;
  reporter?: UserLite | null;
  Labels?: LabelLite[];
}

export interface BoardFull {
  board: Board;
  project?: { id: number; key: string; name: string };
  columns: Column[];
  tickets: Ticket[];
}

export interface Label extends LabelLite {
  projectId: number;
}

export interface Comment {
  id: number;
  ticketId: number;
  authorId: number;
  body: string;
  createdAt: string;
  author?: UserLite | null;
}

export interface Activity {
  id: number;
  ticketId: number;
  actorId: number | null;
  type: string;
  meta: Record<string, unknown>;
  createdAt: string;
  actor?: UserLite | null;
}
