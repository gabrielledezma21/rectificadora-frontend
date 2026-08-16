import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Ban, CheckCircle2, Circle, CircleDot, Printer, RotateCcw, Truck } from 'lucide-react';
import type { TareaTaller, WorkOrder } from '../types';
import { cargarOrden } from '../store';
import { getCurrentUser } from '../auth';
import { cambiarEstadoApi } from '../serviciosApi';

type FormatoImpresion = 'cliente' | 'administrativa' | 'taller';
type EstadoOrden = WorkOrder['estado'];

const etiquetaFormato: Record<FormatoImpresion, string> = {
  cliente: 'Orden para el cliente', administrativa: 'Orden administrativa', taller: 'Hoja de trabajo del taller',
};
const etiquetaEstado: Record<TareaTaller['estado'], string> = {
  DISPONIBLE: 'Disponible', ASIGNADA: 'Asignada', ACEPTADA: 'Aceptada', EN_PROCESO: 'En proceso',
  PENDIENTE: 'Pendiente', FINALIZADA: 'Finalizada',
};
const pasosOrden: Array<{ estado: Exclude<EstadoOrden, 'cancelado'>; etiqueta: string }> = [
  { estado: 'recepcion', etiqueta: 'Recepción' },
  { estado: 'en-proceso', etiqueta: 'En proceso' },
  { estado: 'finalizado', etiqueta: 'Finalizada' },
  { estado: 'entregado', etiqueta: 'Entregada' },
];
const formatearDinero = (valor: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor);

export function PrintOrder() {
  const { id } = useParams();
  const navegar = useNavigate();
  const usuario = getCurrentUser();
  const [parametros, setParametros] = useSearchParams();
  const formatoSolicitado = parametros.get('format');
  const formato: FormatoImpresion = formatoSolicitado === 'administrativa' || formatoSolicitado === 'taller'
    ? formatoSolicitado
    : 'cliente';
  const [orden, setOrden] = useState<WorkOrder>();
  const [error, setError] = useState('');
  const [actualizandoEstado, setActualizandoEstado] = useState(false);

  useEffect(() => {
    if (!id) return;
    cargarOrden(id)
      .then(encontrada => encontrada ? setOrden(encontrada) : navegar('/'))
      .catch(causa => setError(causa instanceof Error ? causa.message : 'No se pudo cargar la orden'));
  }, [id, navegar]);

  if (error) return <main className="min-h-screen bg-background p-8 text-destructive">{error}</main>;
  if (!orden) return <main className="min-h-screen bg-background p-8 text-muted-foreground">Cargando orden…</main>;

  const tareas: TareaTaller[] = orden.tareas || [
    ...orden.trabajosBlock.map(descripcion => ({ id: `block-${descripcion}`, descripcion, categoria: 'BLOCK' as const, estado: 'DISPONIBLE' as const, historial: [] })),
    ...orden.repuestos.map(descripcion => ({ id: `repuesto-${descripcion}`, descripcion, categoria: 'REPUESTO' as const, estado: 'DISPONIBLE' as const, historial: [] })),
    ...orden.trabajosTapa.map(descripcion => ({ id: `tapa-${descripcion}`, descripcion, categoria: 'TAPA' as const, estado: 'DISPONIBLE' as const, historial: [] })),
    ...orden.trabajosCiguenal.map(descripcion => ({ id: `ciguenal-${descripcion}`, descripcion, categoria: 'CIGUENAL' as const, estado: 'DISPONIBLE' as const, historial: [] })),
  ];
  const tareasFinalizadas = tareas.filter(tarea => tarea.estado === 'FINALIZADA').length;
  const todasLasTareasFinalizadas = tareas.length > 0 && tareasFinalizadas === tareas.length;
  const puedeGestionar = usuario?.role === 'admin' || Boolean(usuario?.permissions?.includes('ORDENES_GESTIONAR'));
  const mostrarGestion = formato === 'administrativa' && puedeGestionar;

  const cambiarEstado = async (nuevoEstado: EstadoOrden, confirmacion?: string) => {
    if (confirmacion && !window.confirm(confirmacion)) return;
    setActualizandoEstado(true);
    try {
      const actualizada = await cambiarEstadoApi(orden.id, nuevoEstado);
      setOrden(actualizada);
      setError('');
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo cambiar el estado de la orden');
    } finally {
      setActualizandoEstado(false);
    }
  };

  return <>
    <div className="print:hidden sticky top-0 z-50 border-b border-border bg-background p-4"><div className="mx-auto flex max-w-[210mm] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><button onClick={() => navegar(-1)} className="flex items-center justify-center gap-2 rounded-md bg-secondary px-4 py-2"><ArrowLeft className="h-4 w-4" />Volver</button><div className="flex flex-wrap justify-center gap-2">{(Object.keys(etiquetaFormato) as FormatoImpresion[]).map(valor => <button key={valor} onClick={() => setParametros({ format: valor })} className={`rounded-md px-3 py-2 text-sm ${formato === valor ? 'bg-primary' : 'bg-secondary'}`}>{etiquetaFormato[valor]}</button>)}</div><button onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2"><Printer className="h-4 w-4" />Imprimir / PDF</button></div></div>
    <main className="min-h-screen bg-muted p-4 print:bg-white print:p-0 sm:p-8"><article className="mx-auto max-w-[210mm] bg-white p-7 text-black shadow-2xl print:shadow-none sm:p-12">
      {mostrarGestion ? <FlujoEstadoOrden orden={orden} tareasFinalizadas={tareasFinalizadas} tareasTotales={tareas.length} todasFinalizadas={todasLasTareasFinalizadas} actualizando={actualizandoEstado} cambiarEstado={cambiarEstado} /> : null}

      <header className="mb-7 flex items-start justify-between gap-5 border-b-2 border-black pb-5"><div><h1 className="text-2xl font-bold uppercase">Rectificadora Las Flores</h1><p className="mt-1 text-sm text-gray-600">Rectificación y más · Av. Del Libertador 6085 · (011) 3078-5714</p></div><div className="text-right"><div className="text-xs uppercase text-gray-500">Orden</div><strong className="font-mono text-xl">{orden.orderNumber}</strong></div></header>
      <h2 className="mb-7 text-center text-xl font-bold uppercase tracking-wide">{etiquetaFormato[formato]}</h2>

      {formato !== 'taller' ? <section className="mb-6 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2"><Info label="Cliente" value={orden.cliente} /><Info label="Teléfono" value={orden.clienteTelefono} />{formato === 'administrativa' ? <><Info label="Correo" value={orden.clienteEmail} /><Info label="Dirección" value={orden.clienteDireccion} /></> : null}</section> : null}
      <section className="mb-6 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2"><Info label="Motor / modelo" value={orden.motor} /><Info label="Número de motor" value={orden.numeroMotor} /><Info label="Patente" value={orden.patente} /><Info label="Cilindros" value={String(orden.cantidadCilindros || '')} /><Info label="Fecha" value={new Date(orden.date).toLocaleDateString('es-AR')} /><Info label="Entrega estimada" value={orden.fechaPrometida ? new Date(`${orden.fechaPrometida}T12:00:00`).toLocaleDateString('es-AR') : undefined} /><Info label="Medida final" value={orden.medidaFinal} /></section>
      {orden.descripcionRecepcion ? <DocumentBox title="Descripción de recepción" text={orden.descripcionRecepcion} /> : null}

      <section className="mb-7"><h3 className="mb-3 border-b-2 border-black pb-2 font-bold uppercase">Trabajos</h3><table className="w-full border-collapse text-sm"><thead><tr className="border-b border-gray-400"><th className="py-2 text-left">Tarea</th>{formato === 'taller' || formato === 'administrativa' ? <><th className="py-2 text-left">Estado</th><th className="py-2 text-left">Responsable</th></> : null}{formato !== 'taller' ? <th className="py-2 text-right">Importe</th> : null}</tr></thead><tbody>{tareas.map(tarea => <tr key={tarea.id} className="border-b border-gray-200"><td className="py-2">{tarea.descripcion}</td>{formato === 'taller' || formato === 'administrativa' ? <><td className="py-2">{etiquetaEstado[tarea.estado]}</td><td className="py-2">{tarea.empleadoAsignado?.nombre || '—'}</td></> : null}{formato !== 'taller' ? <td className="py-2 text-right font-mono">{formatearDinero((tarea.precioUnitario || 0) * (tarea.cantidad || 1))}</td> : null}</tr>)}</tbody></table></section>

      {formato === 'taller' ? <>{tareas.filter(tarea => tarea.notasTecnicas).map(tarea => <DocumentBox key={tarea.id} title={`Observaciones · ${tarea.descripcion}`} text={tarea.notasTecnicas || ''} />)}</> : null}
      {formato === 'administrativa' ? <>{tareas.filter(tarea => tarea.notasTecnicas || tarea.historial.length).map(tarea => <DocumentBox key={tarea.id} title={`Seguimiento · ${tarea.descripcion}`} text={[tarea.notasTecnicas, ...tarea.historial.map(evento => `${new Date(evento.fecha).toLocaleString('es-AR')} · ${evento.actor} · ${evento.accion}${evento.comentario ? ` · ${evento.comentario}` : ''}`)].filter(Boolean).join('\n')} />)}</> : null}
      {formato === 'administrativa' && orden.notas ? <DocumentBox title="Notas internas" text={orden.notas} /> : null}
      {formato !== 'taller' ? <section className="ml-auto mt-7 max-w-sm space-y-2 border-t-2 border-black pt-3 text-sm"><Total label="Total" value={orden.total} /><Total label="Pagado" value={orden.sena} /><Total label="Saldo" value={orden.saldo} strong />{formato === 'administrativa' && orden.payments.length ? <div className="mt-4 border-t border-gray-300 pt-3"><div className="mb-2 font-semibold">Pagos registrados</div>{orden.payments.map(pago => <div key={pago.id} className="flex justify-between py-1 text-xs"><span>{new Date(pago.date).toLocaleString('es-AR')} · {pago.method}</span><span className={pago.cancelledAt ? 'line-through' : ''}>{formatearDinero(pago.amount)}</span></div>)}</div> : null}</section> : null}
      {formato === 'cliente' ? <section className="mt-16 grid grid-cols-2 gap-12 text-center text-sm"><div className="border-t border-black pt-2">Firma del cliente</div><div className="border-t border-black pt-2">Firma del taller</div></section> : null}
      <footer className="mt-10 border-t border-gray-300 pt-3 text-center text-xs text-gray-500">Documento generado el {new Date().toLocaleString('es-AR')}</footer>
    </article></main>
    <style>{`@media print { @page { size: A4; margin: 10mm; } body { background: white; } }`}</style>
  </>;
}

function FlujoEstadoOrden({ orden, tareasFinalizadas, tareasTotales, todasFinalizadas, actualizando, cambiarEstado }: {
  orden: WorkOrder;
  tareasFinalizadas: number;
  tareasTotales: number;
  todasFinalizadas: boolean;
  actualizando: boolean;
  cambiarEstado: (estado: EstadoOrden, confirmacion?: string) => Promise<void>;
}) {
  const indiceActual = pasosOrden.findIndex(paso => paso.estado === orden.estado);
  const cancelada = orden.estado === 'cancelado';

  return <section className={`print:hidden mb-7 rounded-xl border p-5 ${cancelada ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'}`}>
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="font-semibold">Estado de la orden</h2><p className="mt-1 text-sm text-gray-600">Seguí el flujo en orden. El sistema evita saltear etapas.</p></div>
      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${cancelada ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-800'}`}>{cancelada ? 'Cancelada' : pasosOrden[indiceActual]?.etiqueta}</span>
    </div>

    {!cancelada ? <div className="mb-5 grid grid-cols-4 gap-2">{pasosOrden.map((paso, indice) => {
      const completado = indice < indiceActual;
      const actual = indice === indiceActual;
      return <div key={paso.estado} className="relative text-center">
        <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 ${completado ? 'border-green-600 bg-green-600 text-white' : actual ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-400'}`}>{completado ? <CheckCircle2 className="h-5 w-5" /> : actual ? <CircleDot className="h-5 w-5" /> : <Circle className="h-5 w-5" />}</div>
        <div className={`mt-2 text-xs ${actual ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{paso.etiqueta}</div>
        {indice < pasosOrden.length - 1 ? <div className={`absolute left-[calc(50%+22px)] top-4 h-0.5 w-[calc(100%-44px)] ${indice < indiceActual ? 'bg-green-600' : 'bg-gray-300'}`} /> : null}
      </div>;
    })}</div> : null}

    {!cancelada && (orden.estado === 'recepcion' || orden.estado === 'en-proceso') ? <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 text-sm">
      <div className="flex items-center justify-between gap-3"><span>Avance del taller</span><strong>{tareasFinalizadas}/{tareasTotales} tareas</strong></div>
      {orden.estado === 'en-proceso' && !todasFinalizadas ? <p className="mt-2 text-xs text-amber-700">Para pasar a Finalizada primero deben terminarse todas las tareas.</p> : null}
      {orden.estado === 'en-proceso' && todasFinalizadas ? <p className="mt-2 text-xs font-medium text-green-700">Todas las tareas están terminadas. La orden está lista para revisión.</p> : null}
    </div> : null}

    <div className="flex flex-wrap gap-2">
      {orden.estado === 'recepcion' ? <button disabled={actualizando} onClick={() => void cambiarEstado('en-proceso')} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Pasar a En proceso</button> : null}
      {orden.estado === 'en-proceso' ? <button disabled={actualizando || !todasFinalizadas} onClick={() => void cambiarEstado('finalizado')} className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">Marcar como finalizada</button> : null}
      {orden.estado === 'finalizado' ? <><button disabled={actualizando} onClick={() => void cambiarEstado('entregado', '¿Confirmás que la orden ya fue entregada al cliente?')} className="flex items-center gap-2 rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"><Truck className="h-4 w-4" />Marcar como entregada</button><button disabled={actualizando} onClick={() => void cambiarEstado('en-proceso', '¿Querés volver esta orden a En proceso para realizar una corrección?')} className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm disabled:opacity-50"><RotateCcw className="h-4 w-4" />Volver a En proceso</button></> : null}
      {orden.estado === 'entregado' ? <span className="flex items-center gap-2 rounded-md bg-green-100 px-4 py-2 text-sm font-medium text-green-800"><CheckCircle2 className="h-4 w-4" />Proceso completado</span> : null}
      {(orden.estado === 'recepcion' || orden.estado === 'en-proceso' || orden.estado === 'finalizado') ? <button disabled={actualizando} onClick={() => void cambiarEstado('cancelado', '¿Confirmás que querés cancelar esta orden? Esta acción cierra el flujo de trabajo.')} className="ml-auto flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm text-red-700 disabled:opacity-50"><Ban className="h-4 w-4" />Cancelar orden</button> : null}
    </div>
  </section>;
}

function Info({ label, value }: { label: string; value?: string }) {
  return <div className="flex border-b border-gray-300 py-2"><strong className="w-36 shrink-0">{label}:</strong><span>{value || '—'}</span></div>;
}
function DocumentBox({ title, text }: { title: string; text: string }) {
  return <section className="mb-6 rounded border border-gray-300 bg-gray-50 p-4"><h3 className="mb-2 text-xs font-bold uppercase text-gray-600">{title}</h3><p className="whitespace-pre-wrap text-sm">{text}</p></section>;
}
function Total({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return <div className={`flex justify-between ${strong ? 'text-lg font-bold' : ''}`}><span>{label}</span><span className="font-mono">{formatearDinero(value)}</span></div>;
}
