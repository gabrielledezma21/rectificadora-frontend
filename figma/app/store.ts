import { WorkOrder } from './types';
import { logActivity } from './audit';

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
