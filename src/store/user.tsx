import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface UserContextValue {
  userId: number | null;
  setUserId: (id: number) => void;
}

const UserContext = createContext<UserContextValue>({ userId: null, setUserId: () => {} });
const STORAGE_KEY = 'kanban.userId';

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<number | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Number(raw) : null;
  });

  const setUserId = (id: number) => {
    localStorage.setItem(STORAGE_KEY, String(id));
    setUserIdState(id);
  };

  // Default to user 1 on first load so the app is usable immediately.
  useEffect(() => {
    if (userId == null) setUserId(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <UserContext.Provider value={{ userId, setUserId }}>{children}</UserContext.Provider>;
}

export function useCurrentUserId() {
  return useContext(UserContext);
}
