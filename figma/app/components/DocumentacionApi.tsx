import { ExternalLink, FileCode2 } from 'lucide-react';

const URL_API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const URL_BACKEND = URL_API.endsWith('/api') ? URL_API.slice(0, -4) : URL_API;
const URL_SWAGGER = URL_BACKEND ? `${URL_BACKEND}/swagger-ui.html` : '';
const URL_OPENAPI = URL_BACKEND ? `${URL_BACKEND}/v3/api-docs` : '';

export function DocumentacionApi() {
  if (!URL_SWAGGER) {
    return (
      <div className="max-w-4xl mx-auto p-6 lg:p-8">
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-6">
          <h1 className="text-2xl font-bold">Documentación API</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            La documentación interactiva requiere que el frontend esté conectado al backend mediante
            <code className="mx-1 rounded bg-secondary px-1.5 py-0.5">NEXT_PUBLIC_API_URL</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-76px)] max-w-[1800px] flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <FileCode2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Documentación API</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Swagger UI generado automáticamente desde el contrato OpenAPI del backend.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={URL_OPENAPI}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm hover:bg-secondary/80"
          >
            OpenAPI JSON <ExternalLink className="h-4 w-4" />
          </a>
          <a
            href={URL_SWAGGER}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Abrir Swagger <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-white">
        <iframe
          src={URL_SWAGGER}
          title="Swagger UI · Documentación de la API"
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}
