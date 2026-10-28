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
| 3 | Registrar producto | Alta | Completada (API verificada; formulario pendiente de prueba en navegador) |
| 4 | Visualizar productos en el home | Alta | Completada |
| 5 | Visualizar detalle de producto | Alta | Completada |
| 6 | Visualizar galería de imágenes | Alta | Completada (galería de 5+ imágenes pendiente de prueba) |
| 7 | Colocar pie de página | Baja | Completada |
| 8 | Paginar productos | Baja | Completada (API verificada; UI pendiente de prueba) |
| 9 | Panel de administración | Media | Completada |
| 10 | Listar productos | Media | Completada |
| 11 | Eliminar producto | Baja | Completada (API verificada; confirmación pendiente de prueba en navegador) |

## 4. Decisiones técnicas

- **Java 17** según la consigna. Se compila y prueba con JDK 17.0.20 (Temurin).
- **Imágenes en base64** guardadas en H2. Es suficiente para el MVP; en producción conviene un almacenamiento de archivos.
- **Paginación del home:** la sección "Recomendaciones" conserva la regla de la historia #4 (10 aleatorios sin repetir). La historia #8 se aplica en una sección aparte "Todos los productos", para no contradecir la aleatoriedad.
- **Aleatoriedad:** la lista se mezcla con `SecureRandom` en cada petición.
- **Identidad:** nombre ReservaYa, logo SVG provisional y paleta violeta/ámbar (ver `docs/identidad/paleta.md`).
- **Panel de administración** sin autenticación (fuera del alcance del sprint). Se bloquea su uso en móviles con un aviso, según la historia #9.

## 5. Bitácora de avance

| Fecha | Actividad |
|---|---|
| 2026-10-27 | Definición del proyecto y creación de la estructura base (backend y frontend). |
| 2026-10-27 | Implementación de las historias #1 a #11 y de la paginación (#8). |
| 2026-10-27 | Configuración del entorno: JDK 17, Maven 3.10.0, Node 22, Git. |
| 2026-10-27 | Pruebas automatizadas: 16/16 OK. Verificación de API y de interfaz (capturas en `docs/pruebas/capturas/`). |
| 2026-10-27 | Documentación: plan de pruebas, identidad de marca, bitácora y README. Publicación en `NMena06/dh-java`. |

## 6. Problemas encontrados y resolución

| Problema | Resolución |
|---|---|
| Java 25 instalado, pero la consigna pide Java 17 | Se instaló JDK 17 y se fijó `java.version` en 17. |
| Git no instalado; el instalador quedó bloqueado por UAC | Se usó Git portable (`C:\Program Tools\git`). |
| Header desbordado en móvil | Reorganización en columna con botones de ancho igual. |
| "Ver más" aparecía con una sola imagen | La condición se cambió a mostrar el botón solo con 5 o más imágenes. |
| Servidor de desarrollo sirviendo código antiguo | Reinicio de Vite con `--force`. |
| Producto con id 1 desaparecido de la base | Sin causa identificada; pendiente de revisión (ver plan de pruebas, hallazgo 1). |

## 7. Pendientes para el cierre del sprint

- Probar en navegador: formulario de alta, paginación, confirmación de borrado, galería con 5+ imágenes y vistas móviles.
- Completar el tablero de Trello (copiar el tablero y mover las tarjetas a "En progreso" y "Hecho").
- Revisar la base H2 y regenerar la semilla si es necesario.
