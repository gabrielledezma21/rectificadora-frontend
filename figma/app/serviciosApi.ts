import { solicitarApi } from './api';
import {
  TRABAJOS_BLOCK,
  REPUESTOS,
  TRABAJOS_TAPA,
  TRABAJOS_CIGUENAL,
  type EstadoTareaTaller,
  type HistorialTareaTaller,
  type OrdenTaller,
  type Payment,
  type Permission,
  type TareaTaller,
  type User,
  type WorkOrder,
} from './types';
import type { Client } from './clientStore';
import type { AuditEntry } from './audit';

type EstadoApi = 'RECEPCION' | 'EN_PROCESO' | 'FINALIZADO' | 'ENTREGADO' | 'CANCELADO';
type CategoriaApi = 'BLOCK' | 'REPUESTO' | 'TAPA' | 'CIGUENAL' | 'OTRO';
type MetodoPagoApi = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CHEQUE' | 'OTRO';

interface VehiculoApi { id: string; description: string; engineNumber?: string; licensePlate?: string }
interface ClienteApi { id: string; name: string; phone?: string; email?: string; address?: string; createdAt: string; vehicles: VehiculoApi[] }
interface HistorialTareaApi {
  occurredAt: string;
  action: HistorialTareaTaller['accion'];
  actor: string;
  employeeId?: string;
  employeeName?: string;
  comment?: string;
}
interface ItemApi {
  id: string; description: string; category: CategoriaApi; unitPrice: number; quantity: number;
  catalogTask?: { id: string }; taskStatus: EstadoTareaTaller;
  assignedEmployee?: { id: string; name: string };
  technicalNotes?: string; history?: HistorialTareaApi[];
}
interface PagoApi { id: string; paidAt: string; amount: number; method: MetodoPagoApi; details?: string; registeredBy?: string; cancelledAt?: string; cancelledBy?: string; cancellationReason?: string }
export interface TareaCatalogo { id: string; name: string; category: CategoriaApi; price: number; active: boolean }
interface OrdenApi {
  id: string; orderNumber: string; createdAt: string; promisedDate?: string;
  client: ClienteApi; vehicle?: VehiculoApi; status: EstadoApi; cylinders?: number;
  finalMeasure?: string; receptionDescription?: string; notes?: string;
  total: number; paid: number; balance: number; items: ItemApi[]; payments: PagoApi[];
}
interface OrdenTallerApi {
  id: string;
  orderNumber: string;
  status: 'RECEPCION' | 'EN_PROCESO';
  vehicle?: VehiculoApi;
  cylinders?: number;
  finalMeasure?: string;
  receptionDescription?: string;
  tasks: Array<{
    id: string;
    description: string;
    category: CategoriaApi;
    status: EstadoTareaTaller;
    assignedEmployee?: { id: string; name: string };
    technicalNotes?: string;
    history: HistorialTareaApi[];
  }>;
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

function adaptarHistorialTarea(historial: HistorialTareaApi[] = []): HistorialTareaTaller[] {
  return historial.map(evento => ({
    fecha: evento.occurredAt,
    accion: evento.action,
    actor: evento.actor,
    idEmpleado: evento.employeeId,
    nombreEmpleado: evento.employeeName,
    comentario: evento.comment,
  }));
}

function adaptarTareaTaller(tarea: OrdenTallerApi['tasks'][number]): TareaTaller {
  return {
    id: tarea.id,
    descripcion: tarea.description,
    categoria: tarea.category,
    estado: tarea.status,
    empleadoAsignado: tarea.assignedEmployee ? { id: tarea.assignedEmployee.id, nombre: tarea.assignedEmployee.name } : undefined,
    notasTecnicas: tarea.technicalNotes,
    historial: adaptarHistorialTarea(tarea.history),
  };
}

function adaptarOrdenTaller(orden: OrdenTallerApi): OrdenTaller {
  return {
    id: orden.id,
    numeroOrden: orden.orderNumber,
    estado: orden.status,
    vehiculo: orden.vehicle ? {
      id: orden.vehicle.id,
      descripcion: orden.vehicle.description,
      numeroMotor: orden.vehicle.engineNumber,
      patente: orden.vehicle.licensePlate,
    } : undefined,
    cilindros: orden.cylinders,
    medidaFinal: orden.finalMeasure,
    descripcionRecepcion: orden.receptionDescription,
    tareas: orden.tasks.map(adaptarTareaTaller),
  };
}

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
    cliente: orden.client.name, clienteTelefono: orden.client.phone, clienteEmail: orden.client.email,
    clienteDireccion: orden.client.address, motor: orden.vehicle?.description || '', numeroMotor: orden.vehicle?.engineNumber || '',
    patente: orden.vehicle?.licensePlate || '', cantidadCilindros: orden.cylinders || 4,
    medidaFinal: orden.finalMeasure || '', notas: orden.notes || '', estado: estadoDesdeApi[orden.status],
    total: Number(orden.total), sena: Number(orden.paid), saldo: Number(orden.balance),
    trabajosBlock: grupos.BLOCK, repuestos: grupos.REPUESTO, trabajosTapa: grupos.TAPA,
    trabajosCiguenal: grupos.CIGUENAL, descripcionRecepcion: orden.receptionDescription || '',
    tareas: (orden.items || []).map(item => ({
      id: item.id,
      descripcion: item.description,
      categoria: item.category,
      estado: item.taskStatus || 'DISPONIBLE',
      empleadoAsignado: item.assignedEmployee ? { id: item.assignedEmployee.id, nombre: item.assignedEmployee.name } : undefined,
      notasTecnicas: item.technicalNotes,
      historial: adaptarHistorialTarea(item.history),
      precioUnitario: Number(item.unitPrice),
      cantidad: item.quantity,
    })),
    payments: (orden.payments || []).map(p => ({ id: p.id, date: p.paidAt, amount: Number(p.amount), method: metodoDesdeApi[p.method], details: p.details || '', registeredBy: p.registeredBy, cancelledAt: p.cancelledAt, cancelledBy: p.cancelledBy, cancellationReason: p.cancellationReason })),
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

export async function listarTareas(includeInactive = false): Promise<TareaCatalogo[]> {
  return solicitarApi<TareaCatalogo[]>(includeInactive ? '/tasks/all' : '/tasks');
}

export const eliminarTareaApi = (id: string) => solicitarApi<void>(`/tasks/${id}`, { method: 'DELETE' });
export const restaurarTareaApi = (id: string) => solicitarApi<TareaCatalogo>(`/tasks/${id}/restore`, { method: 'PATCH' });

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
  return grupos.flatMap(([categoria, nombres]) => nombres.map(descripcion => {
    const tarea = tareas.find(item => item.category === categoria && item.name === descripcion);
    const existente = orden.tareas?.find(item => item.categoria === categoria && item.descripcion === descripcion);
    return { id: existente?.id || null, taskId: tarea?.id || null, description: descripcion, category: categoria, unitPrice: tarea?.price ?? obtenerPrecio(descripcion), quantity: 1 };
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

interface UsuarioApi { id: string; name: string; email: string; role: 'ADMIN' | 'OPERADOR' | 'EMPLEADO_TALLER'; permissions: Permission[]; active: boolean; createdAt: string }
const roleDesdeApi = (role: UsuarioApi['role']): User['role'] => role === 'ADMIN' ? 'admin' : role === 'EMPLEADO_TALLER' ? 'empleado' : 'usuario';
const roleHaciaApi = (role: User['role']): UsuarioApi['role'] => role === 'admin' ? 'ADMIN' : role === 'empleado' ? 'EMPLEADO_TALLER' : 'OPERADOR';
export async function listarUsuarios(): Promise<User[]> {
  const datos = await solicitarApi<UsuarioApi[]>('/users');
  return datos.map(u => ({ id: u.id, name: u.name, email: u.email, password: '', role: roleDesdeApi(u.role), permissions: u.permissions || [], active: u.active, createdAt: u.createdAt }));
}
export async function guardarUsuarioApi(usuario: User): Promise<User> {
  const existe = Boolean(usuario.id);
  const cuerpo = { name: usuario.name, email: usuario.email, password: usuario.password || null, role: roleHaciaApi(usuario.role), permissions: usuario.permissions || [], active: usuario.active ?? true };
  const dato = await solicitarApi<UsuarioApi>(existe ? `/users/${usuario.id}` : '/users', { method: existe ? 'PUT' : 'POST', body: JSON.stringify(cuerpo) });
  return { id: dato.id, name: dato.name, email: dato.email, password: '', role: roleDesdeApi(dato.role), permissions: dato.permissions || [], active: dato.active, createdAt: dato.createdAt };
}
export const eliminarUsuarioApi = (id: string) => solicitarApi<void>(`/users/${id}`, { method: 'DELETE' });

export async function listarOrdenesTaller(): Promise<OrdenTaller[]> {
  const datos = await solicitarApi<OrdenTallerApi[]>('/workshop/orders');
  return datos.map(adaptarOrdenTaller);
}

const ejecutarAccionTarea = async (ruta: string, opciones: RequestInit = {}): Promise<OrdenTaller> =>
  adaptarOrdenTaller(await solicitarApi<OrdenTallerApi>(ruta, opciones));

export const aceptarTareaApi = (id: string) => ejecutarAccionTarea(`/workshop/tasks/${id}/accept`, { method: 'PATCH' });
export const iniciarTareaApi = (id: string) => ejecutarAccionTarea(`/workshop/tasks/${id}/start`, { method: 'PATCH' });
export const pausarTareaApi = (id: string, motivo: string) => ejecutarAccionTarea(`/workshop/tasks/${id}/pending`, { method: 'PATCH', body: JSON.stringify({ reason: motivo }) });
export const finalizarTareaApi = (id: string, comentario: string) => ejecutarAccionTarea(`/workshop/tasks/${id}/complete`, { method: 'PATCH', body: JSON.stringify({ comment: comentario }) });
export const asignarTareaApi = (id: string, idEmpleado: string | null, comentario = '') => ejecutarAccionTarea(`/workshop/tasks/${id}/assignment`, { method: 'PATCH', body: JSON.stringify({ employeeId: idEmpleado, comment: comentario }) });
export const reabrirTareaApi = (id: string, comentario = '') => ejecutarAccionTarea(`/workshop/tasks/${id}/reopen`, { method: 'PATCH', body: JSON.stringify({ comment: comentario }) });

function categoriaAuditoria(tipo: string): AuditEntry['category'] {
  return ({ ORDER: 'orden', CLIENT: 'cliente', PAYMENT: 'pago', USER: 'usuario' } as Record<string, AuditEntry['category']>)[tipo] || 'sistema';
}

function obtenerPrecio(nombre: string): number {
  const todos = [...TRABAJOS_BLOCK, ...REPUESTOS, ...TRABAJOS_TAPA, ...TRABAJOS_CIGUENAL];
  return todos.find(t => t.name === nombre)?.price || 0;
}
