# Sistema de Gestión de Órdenes · Frontend

Interfaz web para la gestión integral de un taller de rectificación de motores.

## Funcionalidades

- Panel operativo y financiero.
- Clientes y vehículos.
- Órdenes de trabajo, tareas, estados y pagos.
- Impresión de órdenes.
- Estadísticas, usuarios, auditoría y exportación de respaldos.
- Roles de administrador y operador.
- Diseño responsive.

## Desarrollo

Requiere Node.js 22 o superior.

```bash
npm ci
npm run dev
```

Copiar `.env.example` como `.env.local` y reemplazar `IP-DE-LA-PC-SERVIDOR`
por la IP fija de la computadora que ejecuta Spring Boot. Sin esa variable, la
interfaz abre un modo de demostración local, separado de la información real.

## Instalación en la red del taller

En la computadora servidor:

```bash
cp .env.example .env
# editar NEXT_PUBLIC_API_URL
docker compose up --build -d
```

La segunda computadora abre `http://IP-DE-LA-PC-SERVIDOR:3000`. El backend debe
permitir ese origen mediante `CORS_ORIGINS`. La URL de la API se incorpora al
compilar la imagen, por lo que hay que reconstruirla si cambia la IP del servidor.

## Calidad

```bash
npm run lint
npm test
```

GitHub Actions ejecuta ambas verificaciones en cada cambio de `main` y en cada PR.
