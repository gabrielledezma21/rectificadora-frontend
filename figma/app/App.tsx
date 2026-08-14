import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router';
import { createAppRouter } from './routes';
import { initializeUsers } from './auth';
import { initializeDemoData } from './demoData';

export default function App() {
  const [router, setRouter] = useState<ReturnType<typeof createAppRouter> | null>(null);

  useEffect(() => {
    initializeUsers();
    initializeDemoData();
    setRouter(createAppRouter());
  }, []);

  if (!router) return null;

  return <RouterProvider router={router} />;
}
