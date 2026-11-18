# ReservaYa

Aplicación de reservas (hoteles, vuelos, alquileres de moda y autos) desarrollada como parte del Desafío Profesional de Digital House.

- **Backend:** Java 17 + Spring Boot 3.2.1 + Spring Security (API REST en `/api`).
- **Frontend:** React 18 + Vite.
- **Base de datos:** H2 en archivo (se crea en `backend/data/`).

## Requisitos

- JDK 17
- Maven 3.9+
- Node.js 20 LTS o superior

## Ejecución

Backend (puerto 8080):

```bash
cd backend
mvn spring-boot:run
```

Frontend (puerto 5173, con proxy a la API):

```bash
cd frontend
npm install
npm run dev
```

Abrir http://localhost:5173.

**Administrador inicial** (se crea si no hay usuarios): `admin@reservaya.com` / `Admin1234`. Desde *Panel de administración → Usuarios* puede otorgar el permiso a otros usuarios registrados.

**Correo de confirmación de registro:** sin configuración, el correo se escribe en el log del backend. Para enviarlo por SMTP, definir antes de arrancar las variables `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD`, `SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true`, `SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true` y `APP_MAIL_FROM` (ver `application.properties`). Consola H2: http://localhost:8080/h2-console (JDBC `jdbc:h2:file:./data/reservaya`, usuario `sa`, sin contraseña).

## Pruebas

```bash
cd backend
mvn test
```

Planes de pruebas y resultados: [Sprint 1](docs/pruebas/plan-de-pruebas.md), [Sprint 2](docs/pruebas/plan-de-pruebas-sprint-2.md). Pruebas end-to-end en navegador (requieren backend y frontend corriendo): [`run.js`](docs/pruebas/e2e/run.js) (Sprint 1) y [`run-sprint2.js`](docs/pruebas/e2e/run-sprint2.js) (Sprint 2).

## API

Las rutas marcadas con 🔒 requieren `Authorization: Bearer <token>`; las marcadas con 👑 requieren rol administrador.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/products` | Lista todos los productos |
| GET | `/api/products/random?limit=10` | Productos aleatorios sin repetir (máx. 10) |
| GET | `/api/products/page?page=0&size=10&categoryIds=1,2` | Listado paginado (máx. 10), filtro opcional por categorías |
| GET | `/api/products/{id}` | Detalle de un producto (con categoría y características) |
| POST | `/api/products` 👑 | Crea un producto (`name`, `description`, `images`, `categoryId`, `featureIds`) |
| PUT | `/api/products/{id}` 👑 | Edita un producto |
| PATCH | `/api/products/{id}/category` 👑 | Asigna o quita (`null`) la categoría |
| DELETE | `/api/products/{id}` 👑 | Elimina un producto |
| GET | `/api/categories` | Lista categorías |
| POST | `/api/categories` 👑 | Crea una categoría (`title`, `description`, `image`) |
| DELETE | `/api/categories/{id}` 👑 | Elimina una categoría (sus productos quedan sin categoría) |
| GET | `/api/features` | Lista características |
| POST / PUT / DELETE | `/api/features[/{id}]` 👑 | Alta, edición y baja de características (`name`, `icon`) |
| POST | `/api/auth/register` | Registro (`firstName`, `lastName`, `email`, `password`) |
| POST | `/api/auth/login` | Inicio de sesión; devuelve `token` y `user` |
| POST | `/api/auth/logout` 🔒 | Cierra la sesión (invalida el token) |
| GET | `/api/auth/me` 🔒 | Datos del usuario autenticado |
| POST | `/api/auth/resend-confirmation` | Reenvía el correo de confirmación |
| GET | `/api/users` 👑 | Lista usuarios registrados |
| PATCH | `/api/users/{id}/role` 👑 | Cambia el rol (`USER` o `ADMIN`) |

Códigos de error: 400 (validación, con `errors` por campo), 401 (sin sesión o credenciales incorrectas), 403 (sin permisos), 404 (no existe), 409 (duplicado o conflicto).

## Documentación

- [Bitácora del Sprint 1](docs/bitacora-sprint-1.md)
- [Bitácora del Sprint 2](docs/bitacora-sprint-2.md)
- [Identidad de marca y paleta](docs/identidad/paleta.md)
- [Plan de pruebas Sprint 1](docs/pruebas/plan-de-pruebas.md)
- [Plan de pruebas Sprint 2](docs/pruebas/plan-de-pruebas-sprint-2.md)
