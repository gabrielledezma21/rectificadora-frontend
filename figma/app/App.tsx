import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router';
import { createAppRouter } from './routes';
import { initializeUsers } from './auth';
import { initializeDemoData } from './demoData';
import { apiConfigurada } from './api';

export default function App() {
  const [router, setRouter] = useState<ReturnType<typeof createAppRouter> | null>(null);
  useEffect(() => {
    queueMicrotask(() => {
      initializeUsers();
      if (!apiConfigurada) initializeDemoData();
      setRouter(createAppRouter());
    });
  }, []);

  if (!router) return null;

  return <RouterProvider router={router} />;
}
