import { createHashRouter } from "react-router";
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
import { CatalogManagement } from "./components/CatalogManagement";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { WorkshopBoard } from "./components/WorkshopBoard";
import { HistorialTareasEmpleado } from "./components/HistorialTareasEmpleado";

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
          <ProtectedRoute permission="ORDENES_GESTIONAR">
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "taller",
        element: <ProtectedRoute><WorkshopBoard /></ProtectedRoute>,
      },
      {
        path: "mi-historial",
        element: <ProtectedRoute><HistorialTareasEmpleado /></ProtectedRoute>,
      },
      {
        path: "ordenes",
        element: <ProtectedRoute permission="ORDENES_GESTIONAR"><OrderList /></ProtectedRoute>,
      },
      {
        path: "crear",
        element: (
          <ProtectedRoute permission="ORDENES_GESTIONAR">
            <CreateOrder />
          </ProtectedRoute>
        ),
      },
      {
        path: "orden/:id",
        element: (
          <ProtectedRoute permission="ORDENES_GESTIONAR">
            <PrintOrder />
          </ProtectedRoute>
        ),
      },
      {
        path: "editar/:id",
        element: (
          <ProtectedRoute permission="ORDENES_GESTIONAR">
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
          <ProtectedRoute permission="CLIENTES_DATOS_BASICOS">
            <ClientList />
          </ProtectedRoute>
        ),
      },
      {
        path: "actividad",
        element: <ProtectedRoute requireAdmin><ActivityLog /></ProtectedRoute>,
      },
      {
        path: "catalogo",
        element: <ProtectedRoute permission="CATALOGO_GESTIONAR"><CatalogManagement /></ProtectedRoute>,
      },
      {
        path: "respaldos",
        element: <ProtectedRoute requireAdmin><DataTools /></ProtectedRoute>,
      },
    ],
  },
]);
