import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Database, Download, Upload, ShieldCheck } from 'lucide-react';
import { logActivity } from '../audit';
import { apiConfigurada, solicitarApi } from '../api';

const KEYS = ['motor_shop_orders','motor_shop_clients','motor_shop_users','motor_shop_audit'];

export function DataTools() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const exportData = async () => {
    try {
    const data = apiConfigurada ? await solicitarApi<Record<string, unknown>>('/backups') : { version: 1, exportedAt: new Date().toISOString(), data: Object.fromEntries(KEYS.map(key => [key, JSON.parse(localStorage.getItem(key) || '[]')])) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `respaldo-taller-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(link.href);
    logActivity('Respaldo generado', 'Exportación completa de datos', 'sistema'); setMessage('Respaldo descargado correctamente.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'No se pudo generar el respaldo.'); }
  };
  const importData = async (file?: File) => {
    if (!file) return;
    if (apiConfigurada) { setMessage('La restauración del servidor se realiza desde PostgreSQL para evitar reemplazos accidentales.'); return; }
    try { const parsed = JSON.parse(await file.text()); if (!parsed.data) throw new Error(); KEYS.forEach(key => parsed.data[key] && localStorage.setItem(key, JSON.stringify(parsed.data[key]))); logActivity('Respaldo restaurado', file.name, 'sistema'); setMessage('Datos restaurados. Recargando…'); setTimeout(() => location.reload(), 800); }
    catch { setMessage('El archivo no es un respaldo válido.'); }
  };
  return <main className="min-h-screen bg-background p-6"><div className="max-w-4xl mx-auto">
    <header className="flex items-center gap-4 mb-8"><button onClick={() => navigate('/')} className="p-2 hover:bg-secondary rounded-md"><ArrowLeft className="w-5 h-5" /></button><div><h1 className="text-4xl font-semibold flex items-center gap-3"><Database className="w-9 h-9 text-primary" />Datos y respaldos</h1><p className="text-muted-foreground mt-1">Protección y portabilidad de la información del taller</p></div></header>
    <section className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 mb-6 flex gap-4"><ShieldCheck className="w-7 h-7 text-green-400 shrink-0" /><div><b className="text-green-300">Respaldo centralizado</b><p className="text-sm text-muted-foreground mt-1">La exportación reúne órdenes, clientes, catálogo, usuarios y auditoría desde el servidor. La copia completa restaurable se genera además con PostgreSQL.</p></div></section>
    <div className="grid md:grid-cols-2 gap-5"><article className="bg-card border border-border rounded-xl p-6"><Download className="w-8 h-8 text-primary mb-4" /><h2 className="text-xl font-semibold">Crear respaldo</h2><p className="text-sm text-muted-foreground my-3">Descargá una copia completa para guardarla fuera de esta computadora.</p><button onClick={exportData} className="w-full px-4 py-3 bg-primary hover:bg-primary/90 rounded-md flex justify-center gap-2"><Download className="w-5 h-5" />Descargar respaldo</button></article>
    <article className="bg-card border border-border rounded-xl p-6"><Upload className="w-8 h-8 text-blue-400 mb-4" /><h2 className="text-xl font-semibold">Restaurar respaldo</h2><p className="text-sm text-muted-foreground my-3">Recuperá la información desde un archivo exportado anteriormente.</p><label className="w-full px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-md flex justify-center gap-2 cursor-pointer"><Upload className="w-5 h-5" />Seleccionar archivo<input type="file" accept="application/json" className="hidden" onChange={e => importData(e.target.files?.[0])} /></label></article></div>
    {message && <div className="mt-5 p-4 bg-primary/10 border border-primary/30 rounded-lg text-sm">{message}</div>}
  </div></main>;
}
