import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { shouldRetry } from './api/queries';
import { ToastProvider } from './components/Toast';
import { router } from './router';
import { AppStoreProvider } from './store/AppStore';
import './styles/tokens.css';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: shouldRetry, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppStoreProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AppStoreProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
