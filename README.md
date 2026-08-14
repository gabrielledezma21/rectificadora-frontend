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

El frontend funciona actualmente con almacenamiento local de demostración. La siguiente integración reemplaza ese almacenamiento por la API de Spring Boot del repositorio `rectificadora-backend`.

## Acceso de demostración

- Usuario: `admin@taller.com`
- Contraseña: `admin123`

Estas credenciales son únicamente para desarrollo y deben cambiarse antes de una instalación real.
