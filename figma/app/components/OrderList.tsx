import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  Edit,
  Eye,
  Filter,
  Plus,
  Search,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';
import type { WorkOrder } from '../types';
import { cargarOrdenes, registrarPago } from '../store';
import { getCurrentUser } from '../auth';
import { cambiarEstadoApi } from '../serviciosApi';

const COLORES_ESTADO: Record<WorkOrder['estado'], string> = {
  recepcion: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'en-proceso': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  finalizado: 'bg-green-500/20 text-green-400 border-green-500/30',
  entregado: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  cancelado: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const ETIQUETAS_ESTADO: Record<WorkOrder['estado'], string> = {
  recepcion: 'Recepción',
  'en-proceso': 'En proceso',
  finalizado: 'Finalizada',
  entregado: 'Entregada',
  cancelado: 'Cancelada',
};

export function OrderList() {
  const navegar = useNavigate();
  const [usuarioActual] = useState(() => getCurrentUser());
  const esAdministrador = usuarioActual?.role === 'admin';
  const puedeGestionarOrdenes = esAdministrador || Boolean(usuarioActual?.permissions?.includes('ORDENES_GESTIONAR'));
  const puedeRegistrarPago = esAdministrador || Boolean(usuarioActual?.permissions?.includes('PAGOS_REGISTRAR'));
  const [ordenes, setOrdenes] = useState<WorkOrder[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('all');
  const [estadoAbierto, setEstadoAbierto] = useState<string>();
  const [estadoActualizando, setEstadoActualizando] = useState<string>();
  const [modalPago, setModalPago] = useState<{ mostrar: boolean; orden: WorkOrder | null }>({ mostrar: false, orden: null });
  const [montoPago, setMontoPago] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'otro'>('efectivo');
  const [detallePago, setDetallePago] = useState('');

  useEffect(() => {
    void cargarListado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarListado() {
    setCargando(true);
    setError('');
    try {
      let cargadas = await cargarOrdenes();
      if (!esAdministrador) {
        const ahora = new Date();
        cargadas = cargadas.filter(orden => {
          const fechaOrden = new Date(orden.date);
          const esDelMesActual = fechaOrden.getMonth() === ahora.getMonth() && fechaOrden.getFullYear() === ahora.getFullYear();
          const sigueAbierta = orden.estado === 'recepcion' || orden.estado === 'en-proceso' || orden.estado === 'finalizado';
          return esDelMesActual || sigueAbierta;
        });
      }
      setOrdenes(cargadas.toSorted((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudieron cargar las órdenes');
    } finally {
      setCargando(false);
    }
  }

  const abrirPago = (orden: WorkOrder) => {
    setModalPago({ mostrar: true, orden });
    setMontoPago(orden.saldo.toString());
    setMetodoPago('efectivo');
    setDetallePago('');
  };

  const registrarPagoActual = async () => {
    if (!modalPago.orden) return;
    const monto = Number(montoPago) || 0;
    if (monto <= 0 || monto > modalPago.orden.saldo) {
      window.alert('Ingrese un monto válido');
      return;
    }
    try {
      await registrarPago(modalPago.orden, monto, metodoPago, detallePago);
      await cargarListado();
      setModalPago({ mostrar: false, orden: null });
      setMontoPago('');
      setMetodoPago('efectivo');
      setDetallePago('');
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo registrar el pago');
    }
  };

  const todasLasTareasFinalizadas = (orden: WorkOrder) => {
    const tareas = orden.tareas || [];
    return tareas.length > 0 && tareas.every(tarea => tarea.estado === 'FINALIZADA');
  };

  const cambiarEstado = async (orden: WorkOrder, nuevoEstado: WorkOrder['estado']) => {
    if (nuevoEstado === 'cancelado' && !window.confirm(`¿Cancelar ${orden.orderNumber}? Esta acción dejará la orden cerrada.`)) return;
    if (nuevoEstado === 'entregado' && !window.confirm(`¿Confirmar que ${orden.orderNumber} fue entregada al cliente?`)) return;
    setEstadoActualizando(orden.id);
    setError('');
    try {
      const actualizada = await cambiarEstadoApi(orden.id, nuevoEstado);
      setOrdenes(actuales => actuales.map(item => item.id === orden.id ? actualizada : item));
      setEstadoAbierto(undefined);
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo cambiar el estado de la orden');
    } finally {
      setEstadoActualizando(undefined);
    }
  };

  const ordenesFiltradas = ordenes.filter(orden => {
    const termino = terminoBusqueda.toLowerCase();
    const coincideBusqueda = orden.cliente.toLowerCase().includes(termino)
      || orden.motor.toLowerCase().includes(termino)
      || orden.orderNumber.toLowerCase().includes(termino);
    const coincideEstado = filtroEstado === 'all' || orden.estado === filtroEstado;
    return coincideBusqueda && coincideEstado;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto">
        {error && <div className="mb-5 bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">{error}</div>}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg"><Wrench className="w-8 h-8 text-primary" /></div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight">Órdenes de Trabajo</h1>
                <p className="text-muted-foreground mt-1">
                  {esAdministrador ? 'Gestión de trabajos de rectificación' : `Trabajos del mes - ${new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navegar('/clientes')} className="px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-md transition-colors flex items-center gap-2"><Users className="w-5 h-5" />Clientes</button>
              {esAdministrador && <button onClick={() => navegar('/usuarios')} className="px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-md transition-colors flex items-center gap-2"><Shield className="w-5 h-5" />Usuarios</button>}
              {esAdministrador && <button onClick={() => navegar('/estadisticas')} className="px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-md transition-colors flex items-center gap-2"><BarChart3 className="w-5 h-5" />Estadísticas</button>}
              <button onClick={() => navegar('/crear')} className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-md transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"><Plus className="w-5 h-5" />Nueva Orden</button>
            </div>
          </div>

          {!esAdministrador && <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"><p className="text-sm text-blue-400">ℹ️ El personal administrativo ve las órdenes del mes actual y todas las que continúan abiertas.</p></div>}

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input value={terminoBusqueda} onChange={evento => setTerminoBusqueda(evento.target.value)} placeholder="Buscar por cliente, motor o número de orden..." className="w-full bg-card border border-border rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select value={filtroEstado} onChange={evento => setFiltroEstado(evento.target.value)} className="w-full bg-card border border-border rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer">
                <option value="all">Todos los estados</option><option value="recepcion">Recepción</option><option value="en-proceso">En proceso</option><option value="finalizado">Finalizada</option><option value="entregado">Entregada</option><option value="cancelado">Cancelada</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Resumen label="Total Órdenes" valor={ordenes.length} />
          <Resumen label="Recepción" valor={ordenes.filter(orden => orden.estado === 'recepcion').length} clase="text-yellow-400 border-yellow-500/30" />
          <Resumen label="En Proceso" valor={ordenes.filter(orden => orden.estado === 'en-proceso').length} clase="text-blue-400 border-blue-500/30" />
          <Resumen label="Finalizadas" valor={ordenes.filter(orden => orden.estado === 'finalizado').length} clase="text-green-400 border-green-500/30" />
        </div>

        {!cargando && ordenesFiltradas.length === 0 ? <div className="bg-card border border-border rounded-lg p-12 text-center"><Wrench className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" /><h3 className="text-xl font-semibold mb-2">No se encontraron órdenes</h3><p className="text-muted-foreground">Probá ajustar los filtros de búsqueda.</p></div> : <div className="bg-card border border-border rounded-lg overflow-visible">
          <table className="w-full">
            <thead><tr className="border-b border-border bg-secondary/50"><th className="text-left px-6 py-4 font-semibold text-sm">Orden</th><th className="text-left px-6 py-4 font-semibold text-sm">Cliente</th><th className="text-left px-6 py-4 font-semibold text-sm">Motor</th><th className="text-left px-6 py-4 font-semibold text-sm">Fecha</th><th className="text-left px-6 py-4 font-semibold text-sm">Estado</th><th className="text-right px-6 py-4 font-semibold text-sm">Saldo Pendiente</th><th className="text-right px-6 py-4 font-semibold text-sm">Acciones</th></tr></thead>
            <tbody>{ordenesFiltradas.map(orden => {
              const puedeFinalizar = todasLasTareasFinalizadas(orden);
              const menuVisible = puedeGestionarOrdenes && estadoAbierto === orden.id && orden.estado !== 'entregado' && orden.estado !== 'cancelado';
              return <tr key={orden.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                <td className="px-6 py-4"><div className="font-mono font-semibold text-primary">{orden.orderNumber}</div></td>
                <td className="px-6 py-4"><div className="font-medium">{orden.cliente}</div></td>
                <td className="px-6 py-4"><div className="text-sm">{orden.motor}</div>{orden.numeroMotor && <div className="text-xs text-muted-foreground font-mono mt-0.5">{orden.numeroMotor}</div>}</td>
                <td className="px-6 py-4"><div className="text-sm font-mono">{new Date(orden.date).toLocaleDateString('es-AR')}</div></td>
                <td className="px-6 py-4">
                  <div className="relative inline-flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!puedeGestionarOrdenes || estadoActualizando === orden.id || orden.estado === 'entregado' || orden.estado === 'cancelado'}
                      onClick={() => setEstadoAbierto(actual => actual === orden.id ? undefined : orden.id)}
                      title={puedeGestionarOrdenes ? 'Cambiar estado' : undefined}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${COLORES_ESTADO[orden.estado]} ${puedeGestionarOrdenes && orden.estado !== 'entregado' && orden.estado !== 'cancelado' ? 'cursor-pointer hover:brightness-125' : 'cursor-default'}`}
                    >
                      {estadoActualizando === orden.id ? 'Actualizando…' : ETIQUETAS_ESTADO[orden.estado]}
                      {puedeGestionarOrdenes && orden.estado !== 'entregado' && orden.estado !== 'cancelado' ? <ChevronDown className="w-3 h-3" /> : null}
                    </button>
                    {orden.saldo === 0 && orden.estado === 'finalizado' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30"><CheckCircle2 className="w-3 h-3" />Pagado</span>}
                    {menuVisible && <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-card p-2 shadow-xl">
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">Siguiente acción</div>
                      {orden.estado === 'recepcion' && <AccionEstado texto="Pasar a En proceso" onClick={() => void cambiarEstado(orden, 'en-proceso')} />}
                      {orden.estado === 'en-proceso' && (puedeFinalizar
                        ? <AccionEstado texto="Revisar y marcar Finalizada" onClick={() => navegar(`/orden/${orden.id}?format=administrativa`)} />
                        : <div className="rounded-md bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">Todavía hay tareas pendientes. Finalizalas antes de cerrar la orden.</div>)}
                      {orden.estado === 'finalizado' && <><AccionEstado texto="Marcar como Entregada" onClick={() => void cambiarEstado(orden, 'entregado')} /><AccionEstado texto="Volver a En proceso" onClick={() => void cambiarEstado(orden, 'en-proceso')} secundaria /></>}
                      {(orden.estado === 'recepcion' || orden.estado === 'en-proceso' || orden.estado === 'finalizado') && <button type="button" onClick={() => void cambiarEstado(orden, 'cancelado')} className="mt-2 w-full rounded-md px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10">Cancelar orden</button>}
                    </div>}
                  </div>
                </td>
                <td className="px-6 py-4 text-right"><div className={`font-mono font-semibold ${orden.saldo === 0 ? 'text-green-400' : orden.saldo < orden.total ? 'text-yellow-400' : 'text-foreground'}`}>${orden.saldo.toFixed(2)}</div>{orden.saldo < orden.total && orden.saldo > 0 && <div className="text-xs text-muted-foreground mt-0.5">Total: ${orden.total.toFixed(2)}</div>}</td>
                <td className="px-6 py-4"><div className="flex items-center justify-end gap-2">{puedeRegistrarPago && orden.saldo > 0 && <button onClick={() => abrirPago(orden)} className="p-2 hover:bg-green-500/10 text-green-400 rounded-md transition-colors" title="Registrar pago"><DollarSign className="w-4 h-4" /></button>}<button onClick={() => navegar(`/orden/${orden.id}`)} className="p-2 hover:bg-secondary rounded-md transition-colors" title="Ver orden"><Eye className="w-4 h-4" /></button>{puedeGestionarOrdenes && <button onClick={() => navegar(`/editar/${orden.id}`)} className="p-2 hover:bg-secondary rounded-md transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>}</div></td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
      </div>

      {modalPago.mostrar && modalPago.orden && <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-card border border-border rounded-lg max-w-md w-full p-6"><h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><DollarSign className="w-6 h-6 text-green-400" />Registrar Pago</h3><div className="space-y-4 mb-6"><div className="bg-secondary/30 rounded-lg p-4"><div className="text-sm text-muted-foreground mb-1">Cliente</div><div className="font-semibold">{modalPago.orden.cliente}</div><div className="text-sm text-muted-foreground mt-2">Orden</div><div className="font-mono font-semibold text-primary">{modalPago.orden.orderNumber}</div></div><div className="grid grid-cols-2 gap-4"><div><div className="text-sm text-muted-foreground mb-1">Total</div><div className="font-mono font-semibold">${modalPago.orden.total.toFixed(2)}</div></div><div><div className="text-sm text-muted-foreground mb-1">Saldo pendiente</div><div className="font-mono font-semibold text-yellow-400">${modalPago.orden.saldo.toFixed(2)}</div></div></div><div><label className="block text-sm text-muted-foreground mb-2">Monto a pagar *</label><input type="number" value={montoPago} onChange={evento => setMontoPago(evento.target.value)} className="w-full bg-input px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-lg" step="0.01" max={modalPago.orden.saldo} autoFocus /></div><div><label className="block text-sm text-muted-foreground mb-2">Método de pago *</label><select value={metodoPago} onChange={evento => setMetodoPago(evento.target.value as typeof metodoPago)} className="w-full bg-input px-4 py-3 rounded-md border border-border"><option value="efectivo">Efectivo</option>{esAdministrador && <option value="transferencia">Transferencia</option>}{esAdministrador && <option value="tarjeta">Tarjeta</option>}{esAdministrador && <option value="cheque">Cheque</option>}{esAdministrador && <option value="otro">Otro</option>}</select></div><div><label className="block text-sm text-muted-foreground mb-2">Detalles / Observaciones</label><textarea value={detallePago} onChange={evento => setDetallePago(evento.target.value)} className="w-full bg-input px-4 py-3 rounded-md border border-border resize-none" rows={2} /></div></div><div className="flex gap-3"><button onClick={() => setModalPago({ mostrar: false, orden: null })} className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/80 rounded-md">Cancelar</button><button onClick={() => void registrarPagoActual()} className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 rounded-md flex items-center justify-center gap-2"><DollarSign className="w-4 h-4" />Registrar Pago</button></div></div></div>}
    </div>
  );
}

function Resumen({ label, valor, clase = '' }: { label: string; valor: number; clase?: string }) {
  return <div className={`bg-card border border-border rounded-lg p-5 ${clase}`}><div className="text-sm mb-1">{label}</div><div className="text-3xl font-bold font-mono">{valor}</div></div>;
}

function AccionEstado({ texto, onClick, secundaria = false }: { texto: string; onClick: () => void; secundaria?: boolean }) {
  return <button type="button" onClick={onClick} className={`w-full rounded-md px-3 py-2 text-left text-sm ${secundaria ? 'text-muted-foreground hover:bg-secondary' : 'font-medium hover:bg-primary/10 hover:text-primary'}`}>{texto}</button>;
}
