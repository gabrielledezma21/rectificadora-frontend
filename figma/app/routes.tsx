import { createHashRouter, Navigate } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { OrderList } from "./components/OrderList";
import { CreateOrder } from "./components/CreateOrder";
import { PrintOrder } from "./components/PrintOrder";
import { Statistics } from "./components/Statistics";
import { Login } from "./components/Login";
import { UserManagement } from "./components/UserManagement";
import { ClientList } from "./components/ClientList";
import { Dashboard } from "./components/Dashboard";
import { ActivityLog } from "./components/ActivityLog";
import { DataTools } from "./components/DataTools";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const createAppRouter = () => createHashRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "ordenes",
        element: <ProtectedRoute><OrderList /></ProtectedRoute>,
      },
      {
        path: "crear",
        element: (
          <ProtectedRoute>
            <CreateOrder />
          </ProtectedRoute>
        ),
      },
      {
        path: "orden/:id",
        element: (
          <ProtectedRoute>
            <PrintOrder />
          </ProtectedRoute>
        ),
      },
      {
        path: "editar/:id",
        element: (
          <ProtectedRoute requireAdmin>
            <CreateOrder />
          </ProtectedRoute>
        ),
      },
      {
        path: "estadisticas",
        element: (
          <ProtectedRoute requireAdmin>
            <Statistics />
          </ProtectedRoute>
        ),
      },
      {
        path: "usuarios",
        element: (
          <ProtectedRoute requireAdmin>
            <UserManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "clientes",
        element: (
          <ProtectedRoute>
            <ClientList />
          </ProtectedRoute>
        ),
      },
      {
        path: "actividad",
        element: <ProtectedRoute requireAdmin><ActivityLog /></ProtectedRoute>,
      },
      {
        path: "respaldos",
        element: <ProtectedRoute requireAdmin><DataTools /></ProtectedRoute>,
      },
    ],
  },
]);
