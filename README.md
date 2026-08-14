# Sistema de Gestión de Órdenes · Frontend

Interfaz web para la gestión integral de un taller de rectificación de motores.

## Funcionalidades

- Panel operativo y financiero.
- Clientes y vehículos.
- Órdenes de trabajo, tareas, estados y pagos.
- Impresión de órdenes.
- Estadísticas, usuarios, auditoría y respaldos.
- Roles de administrador y operador.
- Diseño responsive.

## Desarrollo

Requiere Node.js 22 o superior.

```bash
npm ci
npm run dev
```

Copiar `.env.example` como `.env.local` y configurar `NEXT_PUBLIC_API_URL`
para utilizar el backend. Sin esa variable, la interfaz abre un modo de
demostración local sin credenciales reales ni información del taller.
