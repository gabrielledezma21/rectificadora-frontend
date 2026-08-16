export type Permission =
  | 'ORDENES_GESTIONAR' | 'CLIENTES_DATOS_BASICOS' | 'CLIENTES_VER_HISTORIAL'
  | 'CATALOGO_GESTIONAR' | 'PAGOS_REGISTRAR' | 'FINANZAS_VER'
  | 'ESTADISTICAS_VER' | 'AUDITORIA_VER' | 'USUARIOS_GESTIONAR'
  | 'RESPALDOS_GESTIONAR' | 'TAREAS_TALLER';

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'usuario' | 'empleado';
  name: string;
  createdAt: string;
  active?: boolean;
  permissions: Permission[];
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'otro';
  details: string;
  registeredBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  date: string;
  fechaPrometida?: string;
  clientId?: string;
  vehicleId?: string;
  cliente: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  clienteDireccion?: string;
  motor: string;
  numeroMotor: string;
  patente?: string;
  cantidadCilindros: number;
  medidaFinal?: string;
  notas: string;
  estado: 'recepcion' | 'en-proceso' | 'finalizado' | 'entregado' | 'cancelado';
  total: number;
  sena: number;
  saldo: number;

  trabajosBlock: string[];
  repuestos: string[];
  trabajosTapa: string[];
  trabajosCiguenal: string[];

  descripcionRecepcion: string;
  payments: Payment[];
  metodoPago?: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'otro';
  observacionesPago?: string;
  tareas?: TareaTaller[];
}

export type EstadoTareaTaller = 'DISPONIBLE' | 'ASIGNADA' | 'ACEPTADA' | 'EN_PROCESO' | 'PENDIENTE' | 'FINALIZADA';
export type AccionTareaTaller = 'CREADA' | 'ASIGNADA' | 'REASIGNADA' | 'LIBERADA' | 'ACEPTADA' | 'INICIADA' | 'PAUSADA' | 'RETOMADA' | 'FINALIZADA' | 'REABIERTA';

export interface HistorialTareaTaller {
  fecha: string;
  accion: AccionTareaTaller;
  actor: string;
  idEmpleado?: string;
  nombreEmpleado?: string;
  comentario?: string;
}

export interface TareaTaller {
  id: string;
  descripcion: string;
  categoria: 'BLOCK' | 'REPUESTO' | 'TAPA' | 'CIGUENAL' | 'OTRO';
  estado: EstadoTareaTaller;
  empleadoAsignado?: { id: string; nombre: string };
  notasTecnicas?: string;
  historial: HistorialTareaTaller[];
  precioUnitario?: number;
  cantidad?: number;
}

export interface VehiculoTaller {
  id: string;
  descripcion: string;
  numeroMotor?: string;
  patente?: string;
}

export interface OrdenTaller {
  id: string;
  numeroOrden: string;
  estado: 'RECEPCION' | 'EN_PROCESO';
  vehiculo?: VehiculoTaller;
  cilindros?: number;
  medidaFinal?: string;
  descripcionRecepcion?: string;
  tareas: TareaTaller[];
}

export interface TaskWithPrice {
  name: string;
  price: number;
}

export const TRABAJOS_BLOCK: TaskWithPrice[] = [
  { name: 'Encamisar', price: 15000 },
  { name: 'Rectificar cilindros', price: 12000 },
  { name: 'Bruñido', price: 8000 },
  { name: 'Plano block', price: 6000 },
  { name: 'Ajuste de bancadas', price: 10000 },
  { name: 'Bujes de levas', price: 7000 },
  { name: 'Taponeado', price: 5000 },
  { name: 'Embujado', price: 4500 },
  { name: 'Altura de camisas', price: 3500 },
  { name: 'Cigüeñal para rectificar', price: 18000 },
  { name: 'Verificación de fisuras', price: 5500 },
  { name: 'Lavado de block', price: 3000 },
  { name: 'Pulido de conductos', price: 6500 },
];

export const REPUESTOS: TaskWithPrice[] = [
  { name: 'Válvulas', price: 8000 },
  { name: 'Guías de válvulas', price: 6500 },
  { name: 'Retenes', price: 4000 },
  { name: 'Junta de tapa', price: 5500 },
  { name: 'Resortes', price: 7000 },
  { name: 'Árbol de levas', price: 25000 },
  { name: 'Metales', price: 12000 },
  { name: 'Bomba de aceite', price: 9000 },
  { name: 'Empaquetadura completa', price: 8500 },
  { name: 'Pistones', price: 18000 },
  { name: 'Anillos', price: 10000 },
  { name: 'Cojinetes de bancada', price: 11000 },
];

export const TRABAJOS_TAPA: TaskWithPrice[] = [
  { name: 'Desarme', price: 4000 },
  { name: 'Lavado de tapa', price: 3500 },
  { name: 'Plano de tapa', price: 7000 },
  { name: 'Soldaduras', price: 9000 },
  { name: 'Asientos de válvulas', price: 8500 },
  { name: 'Cambio de guías', price: 7500 },
  { name: 'Rectificación de válvulas', price: 6000 },
  { name: 'Armado de tapa', price: 5000 },
  { name: 'Regulado', price: 4500 },
  { name: 'Prueba de presión', price: 3000 },
  { name: 'Verificación de fisuras', price: 5000 },
];

export const TRABAJOS_CIGUENAL: TaskWithPrice[] = [
  { name: 'Rectificación de muñones', price: 14000 },
  { name: 'Rectificación de bancadas', price: 13000 },
  { name: 'Pulido de cigüeñal', price: 8000 },
  { name: 'Balanceo dinámico', price: 12000 },
  { name: 'Verificación de fisuras', price: 6000 },
  { name: 'Medición de conicidad', price: 3500 },
  { name: 'Medición de ovalización', price: 3500 },
  { name: 'Enderezado', price: 15000 },
  { name: 'Soldadura y mecanizado', price: 16000 },
  { name: 'Tratamiento térmico', price: 11000 },
];
