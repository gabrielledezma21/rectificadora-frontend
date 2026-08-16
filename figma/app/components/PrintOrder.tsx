import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Printer } from 'lucide-react';
import type { TareaTaller, WorkOrder } from '../types';
import { cargarOrden } from '../store';

type FormatoImpresion = 'cliente' | 'administrativa' | 'taller';
const etiquetaFormato: Record<FormatoImpresion, string> = {
  cliente: 'Orden para el cliente', administrativa: 'Orden administrativa', taller: 'Hoja de trabajo del taller',
};
const etiquetaEstado: Record<TareaTaller['estado'], string> = {
  DISPONIBLE: 'Disponible', ASIGNADA: 'Asignada', ACEPTADA: 'Aceptada', EN_PROCESO: 'En proceso',
  PENDIENTE: 'Pendiente', FINALIZADA: 'Finalizada',
};
const formatearDinero = (valor: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor);

export function PrintOrder() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [parametros, setParametros] = useSearchParams();
  const formatoSolicitado = parametros.get('format');
  const formato: FormatoImpresion = formatoSolicitado === 'administrativa' || formatoSolicitado === 'taller'
    ? formatoSolicitado
    : 'cliente';
  const [orden, setOrden] = useState<WorkOrder>();
  const [error, setError] = useState('');

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

  return <>
    <div className="print:hidden sticky top-0 z-50 border-b border-border bg-background p-4"><div className="mx-auto flex max-w-[210mm] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><button onClick={() => navegar(-1)} className="flex items-center justify-center gap-2 rounded-md bg-secondary px-4 py-2"><ArrowLeft className="h-4 w-4" />Volver</button><div className="flex flex-wrap justify-center gap-2">{(Object.keys(etiquetaFormato) as FormatoImpresion[]).map(valor => <button key={valor} onClick={() => setParametros({ format: valor })} className={`rounded-md px-3 py-2 text-sm ${formato === valor ? 'bg-primary' : 'bg-secondary'}`}>{etiquetaFormato[valor]}</button>)}</div><button onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2"><Printer className="h-4 w-4" />Imprimir / PDF</button></div></div>
    <main className="min-h-screen bg-muted p-4 print:bg-white print:p-0 sm:p-8"><article className="mx-auto max-w-[210mm] bg-white p-7 text-black shadow-2xl print:shadow-none sm:p-12">
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

function Info({ label, value }: { label: string; value?: string }) {
  return <div className="flex border-b border-gray-300 py-2"><strong className="w-36 shrink-0">{label}:</strong><span>{value || '—'}</span></div>;
}
function DocumentBox({ title, text }: { title: string; text: string }) {
  return <section className="mb-6 rounded border border-gray-300 bg-gray-50 p-4"><h3 className="mb-2 text-xs font-bold uppercase text-gray-600">{title}</h3><p className="whitespace-pre-wrap text-sm">{text}</p></section>;
}
function Total({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return <div className={`flex justify-between ${strong ? 'text-lg font-bold' : ''}`}><span>{label}</span><span className="font-mono">{formatearDinero(value)}</span></div>;
}
