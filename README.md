# ReservaYa

Aplicación de reservas (hoteles, vuelos, alquileres de moda y autos) desarrollada como parte del Desafío Profesional de Digital House.

- **Backend:** Java 17 + Spring Boot 3.2.1 (API REST en `/api/products`).
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

Abrir http://localhost:5173. Consola H2: http://localhost:8080/h2-console (JDBC `jdbc:h2:file:./data/reservaya`, usuario `sa`, sin contraseña).

## Pruebas

```bash
cd backend
mvn test
```

Plan de pruebas y resultados: [`docs/pruebas/plan-de-pruebas.md`](docs/pruebas/plan-de-pruebas.md).

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/products` | Lista todos los productos |
| GET | `/api/products/random?limit=10` | Productos aleatorios sin repetir (máx. 10) |
| GET | `/api/products/page?page=0&size=10` | Listado paginado (máx. 10 por página) |
| GET | `/api/products/{id}` | Detalle de un producto |
| POST | `/api/products` | Crea un producto (`name`, `description`, `images`) |
| DELETE | `/api/products/{id}` | Elimina un producto |

Códigos de error: 400 (validación), 404 (no existe), 409 (nombre duplicado).

## Documentación

- [Bitácora del Sprint 1](docs/bitacora-sprint-1.md)
- [Identidad de marca y paleta](docs/identidad/paleta.md)
- [Plan de pruebas](docs/pruebas/plan-de-pruebas.md)

## Tablero

Historias de usuario en Trello: _(agregar enlace del tablero)_
