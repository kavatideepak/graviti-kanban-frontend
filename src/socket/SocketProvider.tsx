import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socket = useMemo(
    () => io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', { autoConnect: true }),
    [],
  );

  useEffect(() => () => { socket.disconnect(); }, [socket]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
