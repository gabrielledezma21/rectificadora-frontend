import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ClipboardList, Search } from 'lucide-react';
import { cargarAuditoria, type AuditEntry } from '../audit';

export function ActivityLog() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [allEntries, setAllEntries] = useState<AuditEntry[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { cargarAuditoria().then(setAllEntries).catch(e => setError(e instanceof Error ? e.message : 'No se pudo cargar la auditoría')); }, []);
  const entries = useMemo(() => allEntries.filter(e => `${e.action} ${e.detail} ${e.user}`.toLowerCase().includes(query.toLowerCase())), [allEntries, query]);
  return <main className="min-h-screen bg-background p-6"><div className="max-w-[1400px] mx-auto">
    <header className="flex items-center gap-4 mb-8"><button onClick={() => navigate('/')} className="p-2 hover:bg-secondary rounded-md"><ArrowLeft className="w-5 h-5" /></button><div><h1 className="text-4xl font-semibold flex items-center gap-3"><ClipboardList className="w-9 h-9 text-primary" />Registro de actividad</h1><p className="text-muted-foreground mt-1">Auditoría de cambios realizados por los usuarios</p></div></header>
    {error && <div className="mb-5 bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">{error}</div>}
    <div className="relative mb-5"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por acción, detalle o usuario..." className="w-full bg-card border border-border rounded-lg pl-12 pr-4 py-3" /></div>
    <div className="bg-card border border-border rounded-xl overflow-hidden"><table className="w-full"><thead className="bg-secondary/50"><tr>{['Fecha y hora','Usuario','Acción','Detalle','Categoría'].map(h => <th key={h} className="text-left px-5 py-4 text-sm">{h}</th>)}</tr></thead><tbody>{entries.map(e => <tr key={e.id} className="border-t border-border"><td className="px-5 py-4 text-sm font-mono">{new Date(e.date).toLocaleString('es-AR')}</td><td className="px-5 py-4 text-sm">{e.user}</td><td className="px-5 py-4 font-medium">{e.action}</td><td className="px-5 py-4 text-sm text-muted-foreground">{e.detail}</td><td className="px-5 py-4"><span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary capitalize">{e.category}</span></td></tr>)}</tbody></table>{entries.length === 0 && <p className="p-10 text-center text-muted-foreground">No se encontraron registros.</p>}</div>
  </div></main>;
}
