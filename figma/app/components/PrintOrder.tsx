import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Printer } from 'lucide-react';
import type { WorkOrder, WorkTask } from '../types';
import { cargarOrden } from '../store';

type PrintFormat = 'cliente' | 'administrativa' | 'taller';
const formatLabel: Record<PrintFormat, string> = {
  cliente: 'Orden para el cliente', administrativa: 'Orden administrativa', taller: 'Hoja de trabajo del taller',
};
const stateLabel: Record<WorkTask['status'], string> = {
  DISPONIBLE: 'Disponible', ASIGNADA: 'Asignada', ACEPTADA: 'Aceptada', EN_PROCESO: 'En proceso',
  PENDIENTE: 'Pendiente', FINALIZADA: 'Finalizada',
};
const money = (value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

export function PrintOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requested = params.get('format');
  const format: PrintFormat = requested === 'administrativa' || requested === 'taller' ? requested : 'cliente';
  const [order, setOrder] = useState<WorkOrder>();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    cargarOrden(id).then(found => found ? setOrder(found) : navigate('/')).catch(cause => setError(cause instanceof Error ? cause.message : 'No se pudo cargar la orden'));
  }, [id, navigate]);

  if (error) return <main className="min-h-screen bg-background p-8 text-destructive">{error}</main>;
  if (!order) return <main className="min-h-screen bg-background p-8 text-muted-foreground">Cargando orden…</main>;

  const tasks = order.tareas || [
    ...order.trabajosBlock.map(description => ({ id: `block-${description}`, description, category: 'BLOCK' as const, status: 'DISPONIBLE' as const, history: [] })),
    ...order.repuestos.map(description => ({ id: `repuesto-${description}`, description, category: 'REPUESTO' as const, status: 'DISPONIBLE' as const, history: [] })),
    ...order.trabajosTapa.map(description => ({ id: `tapa-${description}`, description, category: 'TAPA' as const, status: 'DISPONIBLE' as const, history: [] })),
    ...order.trabajosCiguenal.map(description => ({ id: `ciguenal-${description}`, description, category: 'CIGUENAL' as const, status: 'DISPONIBLE' as const, history: [] })),
  ];

  return <>
    <div className="print:hidden sticky top-0 z-50 border-b border-border bg-background p-4"><div className="mx-auto flex max-w-[210mm] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><button onClick={() => navigate(-1)} className="flex items-center justify-center gap-2 rounded-md bg-secondary px-4 py-2"><ArrowLeft className="h-4 w-4" />Volver</button><div className="flex flex-wrap justify-center gap-2">{(Object.keys(formatLabel) as PrintFormat[]).map(value => <button key={value} onClick={() => setParams({ format: value })} className={`rounded-md px-3 py-2 text-sm ${format === value ? 'bg-primary' : 'bg-secondary'}`}>{formatLabel[value]}</button>)}</div><button onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2"><Printer className="h-4 w-4" />Imprimir / PDF</button></div></div>
    <main className="min-h-screen bg-muted p-4 print:bg-white print:p-0 sm:p-8"><article className="mx-auto max-w-[210mm] bg-white p-7 text-black shadow-2xl print:shadow-none sm:p-12">
      <header className="mb-7 flex items-start justify-between gap-5 border-b-2 border-black pb-5"><div><h1 className="text-2xl font-bold uppercase">Rectificadora Las Flores</h1><p className="mt-1 text-sm text-gray-600">Rectificación y más · Av. Del Libertador 6085 · (011) 3078-5714</p></div><div className="text-right"><div className="text-xs uppercase text-gray-500">Orden</div><strong className="font-mono text-xl">{order.orderNumber}</strong></div></header>
      <h2 className="mb-7 text-center text-xl font-bold uppercase tracking-wide">{formatLabel[format]}</h2>

      {format !== 'taller' ? <section className="mb-6 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2"><Info label="Cliente" value={order.cliente} /><Info label="Teléfono" value={order.clienteTelefono} />{format === 'administrativa' ? <><Info label="Correo" value={order.clienteEmail} /><Info label="Dirección" value={order.clienteDireccion} /></> : null}</section> : null}
      <section className="mb-6 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2"><Info label="Motor / modelo" value={order.motor} /><Info label="Número de motor" value={order.numeroMotor} /><Info label="Patente" value={order.patente} /><Info label="Cilindros" value={String(order.cantidadCilindros || '')} /><Info label="Fecha" value={new Date(order.date).toLocaleDateString('es-AR')} /><Info label="Entrega estimada" value={order.fechaPrometida ? new Date(`${order.fechaPrometida}T12:00:00`).toLocaleDateString('es-AR') : undefined} /><Info label="Medida final" value={order.medidaFinal} /></section>
      {order.descripcionRecepcion ? <DocumentBox title="Descripción de recepción" text={order.descripcionRecepcion} /> : null}

      <section className="mb-7"><h3 className="mb-3 border-b-2 border-black pb-2 font-bold uppercase">Trabajos</h3><table className="w-full border-collapse text-sm"><thead><tr className="border-b border-gray-400"><th className="py-2 text-left">Tarea</th>{format === 'taller' || format === 'administrativa' ? <><th className="py-2 text-left">Estado</th><th className="py-2 text-left">Responsable</th></> : null}{format !== 'taller' ? <th className="py-2 text-right">Importe</th> : null}</tr></thead><tbody>{tasks.map(task => <tr key={task.id} className="border-b border-gray-200"><td className="py-2">{task.description}</td>{format === 'taller' || format === 'administrativa' ? <><td className="py-2">{stateLabel[task.status]}</td><td className="py-2">{task.assignedEmployee?.name || '—'}</td></> : null}{format !== 'taller' ? <td className="py-2 text-right font-mono">{money((task.unitPrice || 0) * (task.quantity || 1))}</td> : null}</tr>)}</tbody></table></section>

      {format === 'taller' ? <>{tasks.filter(task => task.technicalNotes).map(task => <DocumentBox key={task.id} title={`Observaciones · ${task.description}`} text={task.technicalNotes || ''} />)}</> : null}
      {format === 'administrativa' ? <>{tasks.filter(task => task.technicalNotes || task.history.length).map(task => <DocumentBox key={task.id} title={`Seguimiento · ${task.description}`} text={[task.technicalNotes, ...task.history.map(event => `${new Date(event.occurredAt).toLocaleString('es-AR')} · ${event.actor} · ${event.action}${event.comment ? ` · ${event.comment}` : ''}`)].filter(Boolean).join('\n')} />)}</> : null}
      {format === 'administrativa' && order.notas ? <DocumentBox title="Notas internas" text={order.notas} /> : null}
      {format !== 'taller' ? <section className="ml-auto mt-7 max-w-sm space-y-2 border-t-2 border-black pt-3 text-sm"><Total label="Total" value={order.total} /><Total label="Pagado" value={order.sena} /><Total label="Saldo" value={order.saldo} strong />{format === 'administrativa' && order.payments.length ? <div className="mt-4 border-t border-gray-300 pt-3"><div className="mb-2 font-semibold">Pagos registrados</div>{order.payments.map(payment => <div key={payment.id} className="flex justify-between py-1 text-xs"><span>{new Date(payment.date).toLocaleString('es-AR')} · {payment.method}</span><span className={payment.cancelledAt ? 'line-through' : ''}>{money(payment.amount)}</span></div>)}</div> : null}</section> : null}
      {format === 'cliente' ? <section className="mt-16 grid grid-cols-2 gap-12 text-center text-sm"><div className="border-t border-black pt-2">Firma del cliente</div><div className="border-t border-black pt-2">Firma del taller</div></section> : null}
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
  return <div className={`flex justify-between ${strong ? 'text-lg font-bold' : ''}`}><span>{label}</span><span className="font-mono">{money(value)}</span></div>;
}
