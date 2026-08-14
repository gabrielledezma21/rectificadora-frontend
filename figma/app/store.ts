import { WorkOrder } from './types';
import { logActivity } from './audit';
import { apiConfigurada } from './api';
import { guardarOrdenApi, listarOrdenes, obtenerOrden, registrarPagoApi } from './serviciosApi';

const STORAGE_KEY = 'motor_shop_orders';

export function getOrders(): WorkOrder[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveOrder(order: WorkOrder): void {
  const orders = getOrders();
  const existingIndex = orders.findIndex(o => o.id === order.id);

  if (existingIndex >= 0) {
    orders[existingIndex] = order;
    logActivity('Orden actualizada', `${order.orderNumber} · ${order.cliente}`, order.payments?.length ? 'pago' : 'orden');
  } else {
    orders.push(order);
    logActivity('Orden creada', `${order.orderNumber} · ${order.cliente}`, 'orden');
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function getOrderById(id: string): WorkOrder | undefined {
  return getOrders().find(o => o.id === id);
}

export function generateOrderNumber(): string {
  const orders = getOrders();
  const maxNumber = orders.reduce((max, order) => {
    const num = parseInt(order.orderNumber.replace(/\D/g, '')) || 0;
    return Math.max(max, num);
  }, 0);
  return `OT-${String(maxNumber + 1).padStart(5, '0')}`;
}

export async function cargarOrdenes(): Promise<WorkOrder[]> {
  return apiConfigurada ? listarOrdenes() : getOrders();
}

export async function cargarOrden(id: string): Promise<WorkOrder | undefined> {
  return apiConfigurada ? obtenerOrden(id) : getOrderById(id);
}

export async function persistirOrden(order: WorkOrder): Promise<WorkOrder> {
  if (apiConfigurada) return guardarOrdenApi(order);
  saveOrder(order);
  return order;
}

export async function registrarPago(order: WorkOrder, amount: number, method: import('./types').Payment['method'], details: string): Promise<WorkOrder> {
  if (apiConfigurada) return registrarPagoApi(order.id, amount, method, details);
  const updatedOrder = {
    ...order, sena: order.sena + amount, saldo: order.saldo - amount,
    payments: [...(order.payments || []), { id: crypto.randomUUID(), date: new Date().toISOString(), amount, method, details }],
  };
  saveOrder(updatedOrder);
  return updatedOrder;
}
