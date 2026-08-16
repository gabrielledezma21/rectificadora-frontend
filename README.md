# Rectificadora · Frontend

Interfaz web del sistema de gestión para una rectificadora de motores. Permite administrar clientes, vehículos, órdenes de trabajo, tareas, pagos, usuarios y el flujo operativo del taller desde una interfaz centralizada.

El frontend está diseñado para ejecutarse en la computadora servidor del taller y ser utilizado también desde otros equipos de la misma red local.

## Funcionalidades principales

- Panel general con estado operativo y financiero.
- Gestión de órdenes de trabajo.
- Flujo visual de estados de una orden:

```text
Recepción → En proceso → Finalizada → Entregada
```

- Revisión administrativa obligatoria antes de finalizar una orden.
- Alerta cuando todas las tareas de una OT están terminadas y requieren revisión.
- Cambio rápido de estado directamente desde el listado de órdenes.
- Edición de órdenes sin selector libre de estado para evitar saltos incorrectos.
- Clientes con múltiples vehículos.
- Historial desplegable de órdenes dentro de cada cliente.
- Catálogo de trabajos y precios.
- Registro de pagos y saldo pendiente.
- Impresión de orden para cliente, administración y taller.
- Tablero específico para empleados del taller.
- Historial personal de tareas realizadas o dejadas pendientes.
- Asignación y reasignación de tareas por parte del administrador.
- Gestión de usuarios y permisos.
- Estadísticas, auditoría y herramientas de respaldo.
- Explorador de documentación OpenAPI para el administrador.
- Acceso directo al Swagger UI generado por el backend.
- Navegación adaptada según rol y permisos.
- Diseño responsive para escritorio y pantallas más pequeñas.

## Tecnologías

| Componente | Tecnología |
|---|---|
| Runtime | Node.js 22.13+ |
| UI | React 19 |
| Routing | React Router 7 |
| Framework / build | Next.js 16 + Vite / Vinext |
| Lenguaje | TypeScript 5.9 |
| Estilos | Tailwind CSS 4 |
| Iconos | Lucide React |
| Calidad | ESLint 9 |
| Contenedores | Docker + Docker Compose |

## Roles visibles en la interfaz

La interfaz distingue tres perfiles principales:

- **Dueño / Administrador**: acceso completo al sistema.
- **Administrativo**: acceso según permisos asignados.
- **Empleado del taller**: acceso al tablero de tareas y a su historial personal.

La navegación se adapta automáticamente al usuario autenticado. Por ejemplo, el administrador dispone de accesos directos a **Usuarios**, **Estadísticas**, **Actividad**, **Respaldos** y **API**, mientras que el empleado ve principalmente **Taller** y **Mi historial**.

## Flujo de una orden

El sistema guía al usuario para evitar cambios de estado incorrectos.

```text
Recepción
   ↓
En proceso
   ↓
Finalizada
   ↓
Entregada
```

Cuando todas las tareas están terminadas, la orden no se finaliza automáticamente. El dueño o administrativo autorizado recibe una alerta para revisar la OT y recién después puede marcarla como finalizada.

Desde el listado de órdenes se puede hacer clic sobre el estado para acceder rápidamente a las acciones permitidas. Si una transición no corresponde, la interfaz la bloquea o explica qué falta completar.

La cancelación se maneja como una acción excepcional separada del flujo normal.

## Flujo del empleado de taller

Cada empleado puede:

- ver órdenes y tareas disponibles;
- aceptar una tarea;
- iniciarla;
- dejarla pendiente indicando un motivo;
- retomarla;
- finalizarla con observaciones;
- consultar su historial personal.

El sistema está pensado para que cada empleado tenga una única tarea activa al mismo tiempo.

## Clientes e historial

La pantalla de clientes muestra:

- datos básicos;
- vehículos registrados;
- resumen financiero, cuando el usuario tiene permiso;
- cantidad de órdenes;
- listado desplegable de todas las órdenes asociadas al cliente.

Cada OT del historial permite acceder directamente a su vista administrativa.

## Documentación de la API

El dueño/administrador dispone de la pantalla **API** en la navegación principal.

La pantalla consume directamente la especificación generada por Springdoc en:

```text
/v3/api-docs
```

No mantiene una copia manual de los endpoints. Si el backend cambia, la documentación se actualiza automáticamente al volver a cargar el contrato OpenAPI.

Desde esta pantalla se puede:

- ver los endpoints agrupados por módulo;
- identificar el método HTTP de cada operación;
- buscar por módulo, ruta o método;
- abrir el JSON OpenAPI original;
- abrir Swagger UI para probar los endpoints de forma interactiva.

La pantalla solo está disponible para el rol administrador.

## Instalación rápida con Docker

### 1. Crear el archivo de entorno

Copiar `.env.example` como `.env`:

```bash
cp .env.example .env
```

Configurar la URL de la API:

```env
NEXT_PUBLIC_API_URL=http://IP-DE-LA-PC-SERVIDOR:8080/api
```

Ejemplo:

```env
NEXT_PUBLIC_API_URL=http://192.168.1.50:8080/api
```

### 2. Construir y levantar el frontend

```bash
docker compose up -d --build
```

El frontend queda disponible en:

```text
http://localhost:3000
```

Desde otra computadora de la red:

```text
http://IP-DE-LA-PC-SERVIDOR:3000
```

La URL definida en `NEXT_PUBLIC_API_URL` se incorpora durante la construcción de la imagen Docker. Si cambia la IP del backend, es necesario reconstruir el frontend.

## Conexión con el backend

El backend debe permitir como origen la dirección real del frontend mediante `CORS_ORIGINS`.

Ejemplo de configuración del backend:

```env
CORS_ORIGINS=http://localhost:3000,http://192.168.1.50:3000
```

El frontend utiliza JWT para autenticación y obtiene un token CSRF para operaciones de escritura. La información de sesión se mantiene en `sessionStorage` del navegador.

La pantalla de documentación también utiliza la URL del backend derivada de `NEXT_PUBLIC_API_URL` para leer `/v3/api-docs` y enlazar Swagger UI.

## Modo conectado y modo local

El frontend considera que existe una API configurada cuando `NEXT_PUBLIC_API_URL` tiene un valor.

Con API configurada:

- clientes, órdenes, pagos, tareas, usuarios y demás módulos se obtienen del backend;
- los datos quedan persistidos en PostgreSQL;
- la autenticación se realiza contra Spring Boot;
- la documentación OpenAPI se obtiene del backend.

Sin API configurada, algunas partes del proyecto pueden utilizar datos locales o de demostración. Ese modo no debe considerarse una instalación productiva del sistema y la pantalla de documentación API informa que necesita un backend configurado.

## Desarrollo local

Requisitos:

- Node.js 22.13 o superior.
- npm.

Instalar dependencias:

```bash
npm ci
```

Ejecutar en desarrollo:

```bash
npm run dev
```

Para trabajar contra el backend local, crear `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Scripts disponibles

| Comando | Uso |
|---|---|
| `npm run dev` | servidor de desarrollo |
| `npm run build` | build validado de producción |
| `npm start` | inicia la aplicación compilada |
| `npm run lint` | ejecuta ESLint |
| `npm test` | ejecuta build y prueba del HTML renderizado |
| `npm run validate:artifact` | valida el artefacto generado |

## Calidad y CI

Validación local recomendada:

```bash
npm run lint
npm test
```

GitHub Actions ejecuta automáticamente:

```text
npm ci
npm run lint
npm test
```

en cada pull request y en cada actualización de `main`.

## Estructura funcional

Las pantallas principales incluyen:

- **Inicio**: resumen operativo, financiero y alertas.
- **Taller**: órdenes y tareas para empleados y administración.
- **Órdenes**: listado, filtros, pagos, edición y gestión rápida de estado.
- **Clientes**: datos, vehículos e historial de órdenes.
- **Catálogo**: trabajos y precios.
- **Usuarios**: altas, edición de roles y permisos.
- **Estadísticas**: métricas mensuales.
- **Actividad**: auditoría de acciones.
- **Respaldos**: herramientas administrativas de exportación.
- **API**: explorador del contrato OpenAPI y acceso a Swagger.
- **Mi historial**: tareas realizadas o pendientes del empleado autenticado.

## Impresión de órdenes

Una orden puede visualizarse en tres formatos:

- **Cliente**: información necesaria para entregar o imprimir al cliente.
- **Administrativa**: incluye seguimiento, responsables, pagos y notas internas.
- **Taller**: orientada al trabajo operativo y observaciones técnicas.

## Uso en la red del taller

Una instalación típica puede utilizar:

```text
PC servidor
├── PostgreSQL
├── Backend Spring Boot :8080
└── Frontend :3000

PC secundaria
└── Navegador → http://IP-SERVIDOR:3000
```

Para que funcione correctamente:

1. la computadora servidor debe mantener una IP estable dentro de la red;
2. el frontend debe compilarse apuntando a esa IP mediante `NEXT_PUBLIC_API_URL`;
3. el backend debe incluir el origen del frontend en `CORS_ORIGINS`;
4. los puertos `3000` y `8080` deben ser accesibles dentro de la red local.

## Producción

Para una instalación real:

- utilizar siempre el backend y PostgreSQL como fuente de datos;
- usar una IP fija o reserva DHCP para la computadora servidor;
- reconstruir el frontend si cambia `NEXT_PUBLIC_API_URL`;
- evitar exponer directamente la aplicación a Internet sin HTTPS y un proxy inverso;
- mantener actualizado el backend y verificar regularmente los respaldos;
- probar los cambios en una rama y mediante CI antes de fusionarlos a `main`.
