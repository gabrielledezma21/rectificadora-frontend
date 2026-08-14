import { saveClient } from './clientStore';
import { getOrders, saveOrder } from './store';

const isoDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export function initializeDemoData(): void {
  if (typeof window === 'undefined' || getOrders().length > 0) return;

  const clients = [
    { id: crypto.randomUUID(), nombre: 'Iván Fernández', telefono: '11 4872-1054', email: 'ivan@email.com', direccion: 'Moreno, Buenos Aires', vehiculos: [{ motor: 'Chevrolet Spin 1.8', numeroMotor: 'F18D4-48312' }], createdAt: isoDaysAgo(80) },
    { id: crypto.randomUUID(), nombre: 'Luis Blanco', telefono: '11 6021-3388', email: '', direccion: 'Paso del Rey', vehiculos: [{ motor: 'Fiat Fire 1.4', numeroMotor: '310A2011' }], createdAt: isoDaysAgo(55) },
    { id: crypto.randomUUID(), nombre: 'Cristina Salpurido', telefono: '11 5518-8140', email: '', direccion: 'Merlo', vehiculos: [{ motor: 'Ford Ranger 3.0', numeroMotor: 'NGD-8821' }], createdAt: isoDaysAgo(40) },
    { id: crypto.randomUUID(), nombre: 'Taller Los Primos', telefono: '11 3948-2201', email: '', direccion: 'Francisco Álvarez', vehiculos: [{ motor: 'Volkswagen Fox 1.6', numeroMotor: 'CFZ-19004' }], createdAt: isoDaysAgo(25) },
  ];
  clients.forEach(saveClient);

  const orders = [
    { cliente: clients[0].nombre, motor: clients[0].vehiculos[0].motor, numeroMotor: 'F18D4-48312', estado: 'recepcion' as const, total: 480000, sena: 100000, days: 1, block: ['Lavado de block'], tapa: ['Desarme', 'Plano de tapa', 'Prueba de presión'], repuestos: ['Retenes'] },
    { cliente: clients[1].nombre, motor: clients[1].vehiculos[0].motor, numeroMotor: '310A2011', estado: 'en-proceso' as const, total: 315000, sena: 150000, days: 3, block: ['Bruñido', 'Plano block'], tapa: [], repuestos: ['Anillos'] },
    { cliente: clients[2].nombre, motor: clients[2].vehiculos[0].motor, numeroMotor: 'NGD-8821', estado: 'finalizado' as const, total: 620000, sena: 620000, days: 8, block: ['Encamisar', 'Rectificar cilindros'], tapa: [], repuestos: ['Pistones', 'Anillos'] },
    { cliente: clients[3].nombre, motor: clients[3].vehiculos[0].motor, numeroMotor: 'CFZ-19004', estado: 'en-proceso' as const, total: 215000, sena: 80000, days: 12, block: [], tapa: ['Desarme', 'Soldaduras', 'Plano de tapa'], repuestos: [], ciguenal: ['Pulido de cigüeñal'] },
  ];

  orders.forEach((item, index) => saveOrder({
    id: crypto.randomUUID(), orderNumber: `OT-${String(index + 25).padStart(5, '0')}`,
    date: isoDaysAgo(item.days), cliente: item.cliente, motor: item.motor, numeroMotor: item.numeroMotor,
    cantidadCilindros: 4, notas: '', estado: item.estado, total: item.total, sena: item.sena,
    saldo: item.total - item.sena, trabajosBlock: item.block, repuestos: item.repuestos,
    trabajosTapa: item.tapa, trabajosCiguenal: item.ciguenal || [], descripcionRecepcion: 'Piezas recibidas y verificadas en mostrador.',
    payments: item.sena ? [{ id: crypto.randomUUID(), date: isoDaysAgo(item.days), amount: item.sena, method: 'efectivo', details: 'Pago inicial' }] : [],
  }));
}
