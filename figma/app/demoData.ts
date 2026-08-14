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
    { id: crypto.randomUUID(), nombre: 'Cliente Demo 1', telefono: '0000-0001', email: 'cliente1@example.com', direccion: 'Localidad Demo', vehiculos: [{ motor: 'Motor Demo 1.8', numeroMotor: 'MOTOR-DEMO-001', patente: 'DEMO-001' }], createdAt: isoDaysAgo(80) },
    { id: crypto.randomUUID(), nombre: 'Cliente Demo 2', telefono: '0000-0002', email: 'cliente2@example.com', direccion: 'Localidad Demo', vehiculos: [{ motor: 'Motor Demo 1.4', numeroMotor: 'MOTOR-DEMO-002', patente: 'DEMO-002' }], createdAt: isoDaysAgo(55) },
    { id: crypto.randomUUID(), nombre: 'Cliente Demo 3', telefono: '0000-0003', email: 'cliente3@example.com', direccion: 'Localidad Demo', vehiculos: [{ motor: 'Motor Demo 3.0', numeroMotor: 'MOTOR-DEMO-003', patente: 'DEMO-003' }], createdAt: isoDaysAgo(40) },
    { id: crypto.randomUUID(), nombre: 'Taller Demo', telefono: '0000-0004', email: 'taller@example.com', direccion: 'Localidad Demo', vehiculos: [{ motor: 'Motor Demo 1.6', numeroMotor: 'MOTOR-DEMO-004', patente: 'DEMO-004' }], createdAt: isoDaysAgo(25) },
  ];
  clients.forEach(saveClient);

  const orders = [
    { cliente: clients[0].nombre, motor: clients[0].vehiculos[0].motor, numeroMotor: 'MOTOR-DEMO-001', estado: 'recepcion' as const, total: 480000, sena: 100000, days: 1, block: ['Lavado de block'], tapa: ['Desarme', 'Plano de tapa', 'Prueba de presión'], repuestos: ['Retenes'] },
    { cliente: clients[1].nombre, motor: clients[1].vehiculos[0].motor, numeroMotor: 'MOTOR-DEMO-002', estado: 'en-proceso' as const, total: 315000, sena: 150000, days: 3, block: ['Bruñido', 'Plano block'], tapa: [], repuestos: ['Anillos'] },
    { cliente: clients[2].nombre, motor: clients[2].vehiculos[0].motor, numeroMotor: 'MOTOR-DEMO-003', estado: 'finalizado' as const, total: 620000, sena: 620000, days: 8, block: ['Encamisar', 'Rectificar cilindros'], tapa: [], repuestos: ['Pistones', 'Anillos'] },
    { cliente: clients[3].nombre, motor: clients[3].vehiculos[0].motor, numeroMotor: 'MOTOR-DEMO-004', estado: 'en-proceso' as const, total: 215000, sena: 80000, days: 12, block: [], tapa: ['Desarme', 'Soldaduras', 'Plano de tapa'], repuestos: [], ciguenal: ['Pulido de cigüeñal'] },
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
