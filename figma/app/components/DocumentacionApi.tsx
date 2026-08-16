import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileCode2, Search } from 'lucide-react';

const URL_API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const URL_BACKEND = URL_API.endsWith('/api') ? URL_API.slice(0, -4) : URL_API;
const URL_SWAGGER = URL_BACKEND ? `${URL_BACKEND}/swagger-ui.html` : '';
const URL_OPENAPI = URL_BACKEND ? `${URL_BACKEND}/v3/api-docs` : '';

type MetodoHttp = 'get' | 'post' | 'put' | 'patch' | 'delete';

type OperacionOpenApi = {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
};

type DocumentoOpenApi = {
  info?: { title?: string; version?: string; description?: string };
  paths?: Record<string, Partial<Record<MetodoHttp, OperacionOpenApi>>>;
};

type EndpointApi = {
  ruta: string;
  metodo: MetodoHttp;
  modulo: string;
  resumen: string;
  descripcion?: string;
};

const METODOS: MetodoHttp[] = ['get', 'post', 'put', 'patch', 'delete'];

const clasesMetodo: Record<MetodoHttp, string> = {
  get: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  post: 'border-green-500/30 bg-green-500/10 text-green-400',
  put: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  patch: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
  delete: 'border-red-500/30 bg-red-500/10 text-red-400',
};

export function DocumentacionApi() {
  const [documento, setDocumento] = useState<DocumentoOpenApi>();
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (!URL_OPENAPI) return;
    fetch(URL_OPENAPI)
      .then(async respuesta => {
        if (!respuesta.ok) throw new Error('No se pudo cargar la especificación OpenAPI');
        return respuesta.json() as Promise<DocumentoOpenApi>;
      })
      .then(datos => {
        setDocumento(datos);
        setError('');
      })
      .catch(causa => setError(causa instanceof Error ? causa.message : 'No se pudo cargar la documentación'));
  }, []);

  const endpoints = useMemo(() => {
    const resultado: EndpointApi[] = [];
    Object.entries(documento?.paths || {}).forEach(([ruta, operaciones]) => {
      METODOS.forEach(metodo => {
        const operacion = operaciones[metodo];
        if (!operacion) return;
        resultado.push({
          ruta,
          metodo,
          modulo: operacion.tags?.[0] || 'Otros',
          resumen: operacion.summary || operacion.operationId || 'Sin descripción',
          descripcion: operacion.description,
        });
      });
    });
    return resultado;
  }, [documento]);

  const endpointsFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase();
    if (!texto) return endpoints;
    return endpoints.filter(endpoint =>
      `${endpoint.modulo} ${endpoint.metodo} ${endpoint.ruta} ${endpoint.resumen}`.toLocaleLowerCase().includes(texto));
  }, [busqueda, endpoints]);

  const modulos = useMemo(() => {
    const agrupados = new Map<string, EndpointApi[]>();
    endpointsFiltrados.forEach(endpoint => {
      const grupo = agrupados.get(endpoint.modulo) || [];
      grupo.push(endpoint);
      agrupados.set(endpoint.modulo, grupo);
    });
    return [...agrupados.entries()].sort(([a], [b]) => a.localeCompare(b, 'es'));
  }, [endpointsFiltrados]);

  if (!URL_OPENAPI) {
    return <div className="max-w-4xl mx-auto p-6 lg:p-8"><div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6"><h1 className="text-2xl font-bold">Documentación API</h1><p className="mt-3 text-sm text-muted-foreground">La documentación requiere que el frontend esté conectado al backend mediante <code className="mx-1 rounded bg-secondary px-1.5 py-0.5">NEXT_PUBLIC_API_URL</code>.</p></div></div>;
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 lg:p-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2"><FileCode2 className="h-5 w-5 text-primary" /></div>
          <div>
            <h1 className="text-xl font-semibold">{documento?.info?.title || 'Documentación API'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Contrato OpenAPI generado automáticamente por el backend{documento?.info?.version ? ` · v${documento.info.version}` : ''}.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={URL_OPENAPI} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm hover:bg-secondary/80">OpenAPI JSON <ExternalLink className="h-4 w-4" /></a>
          <a href={URL_SWAGGER} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90">Abrir Swagger <ExternalLink className="h-4 w-4" /></a>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={busqueda} onChange={evento => setBusqueda(evento.target.value)} placeholder="Buscar módulo, ruta o método..." className="w-full rounded-md border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary" />
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div> : null}
      {!documento && !error ? <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">Cargando contrato OpenAPI…</div> : null}

      <div className="space-y-5">
        {modulos.map(([modulo, operaciones]) => (
          <section key={modulo} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3"><h2 className="font-semibold">{modulo}</h2><span className="text-xs text-muted-foreground">{operaciones.length} endpoint{operaciones.length === 1 ? '' : 's'}</span></div>
            <div className="divide-y divide-border">
              {operaciones.map(endpoint => (
                <div key={`${endpoint.metodo}-${endpoint.ruta}`} className="grid gap-3 p-4 md:grid-cols-[78px_minmax(220px,1fr)_1.5fr] md:items-center">
                  <span className={`w-fit rounded border px-2 py-1 text-xs font-bold uppercase ${clasesMetodo[endpoint.metodo]}`}>{endpoint.metodo}</span>
                  <code className="break-all text-sm">{endpoint.ruta}</code>
                  <div><div className="text-sm font-medium">{endpoint.resumen}</div>{endpoint.descripcion ? <p className="mt-1 text-xs text-muted-foreground">{endpoint.descripcion}</p> : null}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {documento && endpointsFiltrados.length === 0 ? <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">No se encontraron endpoints para esa búsqueda.</div> : null}
    </div>
  );
}
