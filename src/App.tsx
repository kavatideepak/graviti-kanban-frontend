import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider } from './store/user';
import { ThemeProvider } from './store/theme';
import { ToastProvider } from './store/toast';
import { SocketProvider } from './socket/SocketProvider';
import { ProjectsPage } from './pages/ProjectsPage';
import { BoardPage } from './pages/BoardPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 10_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <UserProvider>
            <SocketProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<ProjectsPage />} />
                  <Route path="/boards/:boardId" element={<BoardPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </SocketProvider>
          </UserProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
