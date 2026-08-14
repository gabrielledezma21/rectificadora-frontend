import { solicitarApi } from './api';
import { TRABAJOS_BLOCK, REPUESTOS, TRABAJOS_TAPA, TRABAJOS_CIGUENAL, type Payment, type User, type WorkOrder } from './types';
import type { Client } from './clientStore';
import type { AuditEntry } from './audit';

type EstadoApi = 'RECEPCION' | 'EN_PROCESO' | 'FINALIZADO' | 'ENTREGADO' | 'CANCELADO';
type CategoriaApi = 'BLOCK' | 'REPUESTO' | 'TAPA' | 'CIGUENAL' | 'OTRO';
type MetodoPagoApi = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CHEQUE' | 'OTRO';

interface VehiculoApi { id: string; description: string; engineNumber?: string; licensePlate?: string }
interface ClienteApi { id: string; name: string; phone?: string; email?: string; address?: string; createdAt: string; vehicles: VehiculoApi[] }
interface ItemApi { id: string; description: string; category: CategoriaApi; unitPrice: number; quantity: number; catalogTask?: { id: string } }
interface PagoApi { id: string; paidAt: string; amount: number; method: MetodoPagoApi; details?: string }
export interface TareaCatalogo { id: string; name: string; category: CategoriaApi; price: number; active: boolean }
interface OrdenApi {
  id: string; orderNumber: string; createdAt: string; promisedDate?: string;
  client: ClienteApi; vehicle?: VehiculoApi; status: EstadoApi; cylinders?: number;
  finalMeasure?: string; receptionDescription?: string; notes?: string;
  total: number; paid: number; balance: number; items: ItemApi[]; payments: PagoApi[];
}

const estadoDesdeApi: Record<EstadoApi, WorkOrder['estado']> = {
  RECEPCION: 'recepcion', EN_PROCESO: 'en-proceso', FINALIZADO: 'finalizado',
  ENTREGADO: 'entregado', CANCELADO: 'cancelado',
};
const estadoHaciaApi: Record<WorkOrder['estado'], EstadoApi> = {
  recepcion: 'RECEPCION', 'en-proceso': 'EN_PROCESO', finalizado: 'FINALIZADO',
  entregado: 'ENTREGADO', cancelado: 'CANCELADO',
};
const metodoHaciaApi: Record<Payment['method'], MetodoPagoApi> = {
  efectivo: 'EFECTIVO', transferencia: 'TRANSFERENCIA', tarjeta: 'TARJETA',
  cheque: 'CHEQUE', otro: 'OTRO',
};
const metodoDesdeApi = Object.fromEntries(Object.entries(metodoHaciaApi).map(([a, b]) => [b, a])) as Record<MetodoPagoApi, Payment['method']>;

export function adaptarCliente(cliente: ClienteApi): Client {
  return {
    id: cliente.id, nombre: cliente.name, telefono: cliente.phone, email: cliente.email,
    direccion: cliente.address, createdAt: cliente.createdAt,
    vehiculos: (cliente.vehicles || []).map(v => ({ id: v.id, motor: v.description, numeroMotor: v.engineNumber, patente: v.licensePlate })),
  };
}

export function adaptarOrden(orden: OrdenApi): WorkOrder {
  const grupos: Record<CategoriaApi, string[]> = { BLOCK: [], REPUESTO: [], TAPA: [], CIGUENAL: [], OTRO: [] };
  (orden.items || []).forEach(item => grupos[item.category]?.push(item.description));
  return {
    id: orden.id, orderNumber: orden.orderNumber, date: orden.createdAt,
    fechaPrometida: orden.promisedDate || '', clientId: orden.client.id, vehicleId: orden.vehicle?.id,
    cliente: orden.client.name, motor: orden.vehicle?.description || '', numeroMotor: orden.vehicle?.engineNumber || '',
    patente: orden.vehicle?.licensePlate || '', cantidadCilindros: orden.cylinders || 4,
    medidaFinal: orden.finalMeasure || '', notas: orden.notes || '', estado: estadoDesdeApi[orden.status],
    total: Number(orden.total), sena: Number(orden.paid), saldo: Number(orden.balance),
    trabajosBlock: grupos.BLOCK, repuestos: grupos.REPUESTO, trabajosTapa: grupos.TAPA,
    trabajosCiguenal: grupos.CIGUENAL, descripcionRecepcion: orden.receptionDescription || '',
    payments: (orden.payments || []).map(p => ({ id: p.id, date: p.paidAt, amount: Number(p.amount), method: metodoDesdeApi[p.method], details: p.details || '' })),
  };
}

export async function listarClientes(consulta = ''): Promise<Client[]> {
  const datos = await solicitarApi<ClienteApi[]>(`/clients${consulta ? `?q=${encodeURIComponent(consulta)}` : ''}`);
  return datos.map(adaptarCliente);
}

export async function guardarClienteApi(cliente: Client): Promise<Client> {
  const cuerpo = {
    name: cliente.nombre, phone: cliente.telefono || null, email: cliente.email || null,
    address: cliente.direccion || null,
    vehicles: cliente.vehiculos.map(v => ({ id: v.id || null, description: v.motor, engineNumber: v.numeroMotor || null, licensePlate: v.patente || null })),
  };
  const ruta = cliente.id ? `/clients/${cliente.id}` : '/clients';
  const metodo = cliente.id ? 'PUT' : 'POST';
  return adaptarCliente(await solicitarApi<ClienteApi>(ruta, { method: metodo, body: JSON.stringify(cuerpo) }));
}

export async function eliminarClienteApi(id: string): Promise<void> {
  await solicitarApi<void>(`/clients/${id}`, { method: 'DELETE' });
}

export async function listarOrdenes(consulta = ''): Promise<WorkOrder[]> {
  const datos = await solicitarApi<OrdenApi[]>(`/orders${consulta ? `?q=${encodeURIComponent(consulta)}` : ''}`);
  return datos.map(adaptarOrden);
}

export async function listarTareas(): Promise<TareaCatalogo[]> {
  return solicitarApi<TareaCatalogo[]>('/tasks');
}

export async function guardarTareaApi(tarea: TareaCatalogo): Promise<TareaCatalogo> {
  const existe = Boolean(tarea.id);
  return solicitarApi<TareaCatalogo>(existe ? `/tasks/${tarea.id}` : '/tasks', {
    method: existe ? 'PUT' : 'POST', body: JSON.stringify({ name: tarea.name, category: tarea.category, price: tarea.price, active: tarea.active }),
  });
}

export async function obtenerOrden(id: string): Promise<WorkOrder> {
  return adaptarOrden(await solicitarApi<OrdenApi>(`/orders/${id}`));
}

function itemsDe(orden: WorkOrder, tareas: TareaCatalogo[]) {
  const grupos: Array<[CategoriaApi, string[]]> = [
    ['BLOCK', orden.trabajosBlock], ['REPUESTO', orden.repuestos], ['TAPA', orden.trabajosTapa], ['CIGUENAL', orden.trabajosCiguenal],
  ];
  return grupos.flatMap(([category, nombres]) => nombres.map(description => {
    const tarea = tareas.find(t => t.category === category && t.name === description);
    return { taskId: tarea?.id || null, description, category, unitPrice: tarea?.price ?? obtenerPrecio(description), quantity: 1 };
  }));
}

export async function guardarOrdenApi(orden: WorkOrder): Promise<WorkOrder> {
  if (!orden.clientId) throw new Error('Seleccioná un cliente registrado');
  const tareas = await listarTareas();
  const cuerpo = {
    clientId: orden.clientId, vehicleId: orden.vehicleId || null,
    promisedDate: orden.fechaPrometida || null, status: estadoHaciaApi[orden.estado],
    cylinders: orden.cantidadCilindros, finalMeasure: orden.medidaFinal || null,
    receptionDescription: orden.descripcionRecepcion || null, notes: orden.notas || null,
    items: itemsDe(orden, tareas),
  };
  const existe = Boolean(orden.orderNumber);
  const respuesta = await solicitarApi<OrdenApi>(existe ? `/orders/${orden.id}` : '/orders', {
    method: existe ? 'PUT' : 'POST', body: JSON.stringify(cuerpo),
  });
  return adaptarOrden(respuesta);
}

export async function registrarPagoApi(id: string, amount: number, method: Payment['method'], details: string): Promise<WorkOrder> {
  return adaptarOrden(await solicitarApi<OrdenApi>(`/orders/${id}/payments`, {
    method: 'POST', body: JSON.stringify({ amount, method: metodoHaciaApi[method], details }),
  }));
}

export async function cambiarEstadoApi(id: string, estado: WorkOrder['estado']): Promise<WorkOrder> {
  return adaptarOrden(await solicitarApi<OrdenApi>(`/orders/${id}/status?value=${estadoHaciaApi[estado]}`, { method: 'PATCH' }));
}

export interface ResumenApi { totalOrders: number; byStatus: Record<string, number>; billed: number; collected: number; pending: number; topTasks: Record<string, number> }
export const obtenerEstadisticas = (year: number, month: number) => solicitarApi<ResumenApi>(`/statistics?year=${year}&month=${month}`);

interface AuditoriaApi { id: string; occurredAt: string; username: string; action: string; entityType: string; detail?: string }
export async function listarAuditoria(): Promise<AuditEntry[]> {
  const datos = await solicitarApi<AuditoriaApi[]>('/audit');
  return datos.map(a => ({ id: a.id, date: a.occurredAt, user: a.username, action: a.action, detail: a.detail || '', category: categoriaAuditoria(a.entityType) }));
}

interface UsuarioApi { id: string; name: string; email: string; role: 'ADMIN' | 'OPERADOR'; active: boolean; createdAt: string }
export async function listarUsuarios(): Promise<User[]> {
  const datos = await solicitarApi<UsuarioApi[]>('/users');
  return datos.map(u => ({ id: u.id, name: u.name, email: u.email, password: '', role: u.role === 'ADMIN' ? 'admin' : 'usuario', active: u.active, createdAt: u.createdAt }));
}
export async function guardarUsuarioApi(usuario: User): Promise<User> {
  const existe = Boolean(usuario.id);
  const cuerpo = { name: usuario.name, email: usuario.email, password: usuario.password || null, role: usuario.role === 'admin' ? 'ADMIN' : 'OPERADOR', active: usuario.active ?? true };
  const dato = await solicitarApi<UsuarioApi>(existe ? `/users/${usuario.id}` : '/users', { method: existe ? 'PUT' : 'POST', body: JSON.stringify(cuerpo) });
  return { id: dato.id, name: dato.name, email: dato.email, password: '', role: dato.role === 'ADMIN' ? 'admin' : 'usuario', active: dato.active, createdAt: dato.createdAt };
}
export const eliminarUsuarioApi = (id: string) => solicitarApi<void>(`/users/${id}`, { method: 'DELETE' });

function categoriaAuditoria(tipo: string): AuditEntry['category'] {
  return ({ ORDER: 'orden', CLIENT: 'cliente', PAYMENT: 'pago', USER: 'usuario' } as Record<string, AuditEntry['category']>)[tipo] || 'sistema';
}

function obtenerPrecio(nombre: string): number {
  const todos = [...TRABAJOS_BLOCK, ...REPUESTOS, ...TRABAJOS_TAPA, ...TRABAJOS_CIGUENAL];
  return todos.find(t => t.name === nombre)?.price || 0;
}
