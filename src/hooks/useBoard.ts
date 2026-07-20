import { useQuery } from '@tanstack/react-query';
import { getBoardFull } from '../api/endpoints';

export const boardKey = (boardId: number) => ['board', boardId] as const;

export function useBoard(boardId: number) {
  return useQuery({
    queryKey: boardKey(boardId),
    queryFn: () => getBoardFull(boardId),
  });
}
