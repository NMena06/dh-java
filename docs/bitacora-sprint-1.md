# Bitácora - Sprint 1 (ReservaYa)

Proyecto del Desafío Profesional (Digital House). Aplicación de reservas (hoteles, vuelos, alquileres de moda y autos) con manejo de disponibilidad.

## 1. Definición del proyecto

**Solución:** ReservaYa es una aplicación web de reservas. El Sprint 1 entrega la estructura base del sitio y el catálogo de servicios: registro, visualización y eliminación de productos.

**Stack:**
- Backend: Java 17, Spring Boot 3.2.1, Spring Data JPA, validación, H2 (archivo local).
- Frontend: React 18, Vite, react-router-dom.
- Repositorio: GitHub `NMena06/dh-java`.

**Meta del sprint:** desarrollar la estructura básica del sitio y agregar las funciones de registro, visualización y eliminación de productos.

## 2. Roles

| Rol | Responsable |
|---|---|
| Scrum Master | _(completar)_ |
| Ref. UX/UI (identidad de marca) | _(completar)_ |
| TL Testing | _(completar)_ |
| TL Frontend | _(completar)_ |
| TL Backend | _(completar)_ |
| TL BBDD | _(completar)_ |
| TL Infra | _(completar)_ |

## 3. Historias de usuario

| # | Historia | Prioridad | Estado |
|---|---|---|---|
| 1 | Colocar encabezado | Alta | Completada |
| 2 | Definir el cuerpo del sitio | Alta | Completada |
| 3 | Registrar producto | Alta | Completada (probada en navegador y API) |
| 4 | Visualizar productos en el home | Alta | Completada |
| 5 | Visualizar detalle de producto | Alta | Completada |
| 6 | Visualizar galería de imágenes | Alta | Completada (probada con 5 imágenes) |
| 7 | Colocar pie de página | Baja | Completada |
| 8 | Paginar productos | Baja | Completada (probada en navegador y API) |
| 9 | Panel de administración | Media | Completada |
| 10 | Listar productos | Media | Completada |
| 11 | Eliminar producto | Baja | Completada (probada en navegador y API) |

## 4. Decisiones técnicas

- **Java 17** según la consigna. Se compila y prueba con JDK 17.0.20 (Temurin).
- **Imágenes en base64** guardadas en H2. Es suficiente para el MVP; en producción conviene un almacenamiento de archivos.
- **Paginación del home:** la sección "Recomendaciones" conserva la regla de la historia #4 (10 aleatorios sin repetir). La historia #8 se aplica en una sección aparte "Todos los productos", para no contradecir la aleatoriedad.
- **Aleatoriedad:** la lista se mezcla con `SecureRandom` en cada petición.
- **Identidad:** nombre ReservaYa, logo SVG provisional y paleta violeta/ámbar (ver `docs/identidad/paleta.md`).
- **Panel de administración** sin autenticación (fuera del alcance del sprint). Se bloquea su uso en móviles con un aviso, según la historia #9.
