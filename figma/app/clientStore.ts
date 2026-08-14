import { logActivity } from './audit';

export interface Vehicle {
  motor: string;
  numeroMotor?: string;
}

export interface Client {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  vehiculos: Vehicle[];
  createdAt: string;
}

const CLIENTS_KEY = 'motor_shop_clients';

export function getClients(): Client[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(CLIENTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveClient(client: Client): void {
  const clients = getClients();
  const existingIndex = clients.findIndex(c => c.id === client.id);

  if (existingIndex >= 0) {
    clients[existingIndex] = client;
    logActivity('Cliente actualizado', client.nombre, 'cliente');
  } else {
    clients.push(client);
    logActivity('Cliente registrado', client.nombre, 'cliente');
  }

  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

export function getClientById(id: string): Client | undefined {
  return getClients().find(c => c.id === id);
}

export function deleteClient(id: string): void {
  const current = getClients();
  const deleted = current.find(c => c.id === id);
  const clients = current.filter(c => c.id !== id);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  if (deleted) logActivity('Cliente eliminado', deleted.nombre, 'cliente');
}

export function findClientsByName(query: string): Client[] {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();
  return getClients().filter(c =>
    c.nombre.toLowerCase().includes(lowerQuery)
  );
}

export function getOrCreateClient(nombre: string, motor: string, numeroMotor?: string): Client {
  const clients = getClients();
  let client = clients.find(c => c.nombre.toLowerCase() === nombre.toLowerCase());

  if (client) {
    // Verificar si el vehículo ya existe
    const vehicleExists = client.vehiculos.some(v =>
      v.motor.toLowerCase() === motor.toLowerCase()
    );

    if (!vehicleExists) {
      client.vehiculos.push({ motor, numeroMotor });
      saveClient(client);
    }
  } else {
    // Crear nuevo cliente
    client = {
      id: crypto.randomUUID(),
      nombre,
      vehiculos: [{ motor, numeroMotor }],
      createdAt: new Date().toISOString(),
    };
    saveClient(client);
  }

  return client;
}

// Función para calcular estadísticas financieras de un cliente
export function getClientFinancialStats(clientName: string, orders: any[]) {
  const clientOrders = orders.filter(o =>
    o.cliente.toLowerCase() === clientName.toLowerCase()
  );

  const totalFacturado = clientOrders.reduce((sum, o) => sum + o.total, 0);
  const totalPagado = clientOrders.reduce((sum, o) => sum + o.sena, 0);
  const totalPendiente = clientOrders.reduce((sum, o) => sum + o.saldo, 0);

  return {
    ordersCount: clientOrders.length,
    totalFacturado,
    totalPagado,
    totalPendiente,
    lastOrderDate: clientOrders.length > 0
      ? clientOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
      : null,
  };
}
