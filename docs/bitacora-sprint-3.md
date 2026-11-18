# Bitácora - Sprint 3 (ReservaYa)

## 1. Definición del proyecto

**Solución:** ReservaYa es una aplicación web de reservas (hoteles, vuelos, alquileres de moda y autos) con manejo de disponibilidad. El Sprint 3 suma la búsqueda de productos por texto y fechas, la disponibilidad en el detalle, favoritos, políticas de uso, compartir en redes, valoraciones con estrellas y la confirmación al eliminar categorías.

**Stack:**
- Backend: Java 17, Spring Boot 3.2.1, Spring Data JPA, Spring Security, Spring Mail, H2 (archivo local).
- Frontend: React 18, Vite, react-router-dom. Calendario doble propio, sin librerías externas.
- Repositorio: GitHub `NMena06/dh-java`.

## 2. Roles

| Rol | Responsable |
|---|---|
| Scrum Master | _(completar)_ |
| TL Testing | _(completar)_ |
| TL Frontend | _(completar)_ |
| TL Backend | _(completar)_ |
| TL BBDD | _(completar)_ |
| TL Infra | _(completar)_ |

## 3. Historias de usuario

| # | Historia | Prioridad | Estado |
|---|---|---|---|
| 22 | Realizar búsqueda | Alta | Completada |
| 23 | Visualizar disponibilidad | Alta | Completada |
| 24 | Marcar como favorito | Media | Completada |
| 25 | Listar productos favoritos | Media | Completada |
| 26 | Ver bloque de políticas del producto | Media | Completada |
| 27 | Redes: compartir productos | Baja | Completada |
| 28 | Puntuar producto | Baja | Completada |
| 29 | Eliminar categoría | Baja | Completada |

### Cómo se cumple cada historia

- **#22 Búsqueda:** el bloque del home tiene un título, un párrafo descriptivo, el campo "¿Qué buscas?", un selector de fechas con **calendario doble** (dos meses, rango de entrada y salida, días pasados deshabilitados) y el botón **"Realizar búsqueda"**.
  - Al escribir aparecen **sugerencias** de productos y categorías, con la coincidencia resaltada y navegación con teclado.
  - Los resultados se ordenan por **relevancia**: cada palabra debe aparecer, sin distinguir mayúsculas ni tildes, y pesa más una coincidencia en el nombre que en la categoría o la descripción.
  - Con fechas, se excluyen los productos reservados en ese rango.
  - Los resultados aparecen en una sección propia, con cantidad, criterio y paginación. Las secciones de categorías y recomendaciones se mantienen como estaban.
- **#23 Disponibilidad:** el detalle muestra un calendario doble con las fechas libres en verde y las ocupadas en rojo y tachadas, más una leyenda. Se puede elegir un rango; si incluye noches ocupadas, no se acepta. Si falla la consulta, se muestra "No pudimos obtener la disponibilidad en este momento" con el botón **Reintentar**.
- **#24 Favoritos:** cada tarjeta tiene un corazón; un clic marca o desmarca. También está en el encabezado del detalle. Sin sesión, el corazón lleva al login con el aviso "Inicia sesión para guardar tus favoritos".
- **#25 Lista de favoritos:** se entra por *Mis favoritos* en el menú del avatar y en *Mi cuenta*. Todas las vistas leen el mismo estado, así que marcar o desmarcar en cualquier sección se refleja al instante. Cada producto se puede quitar desde la lista, y el diseño se adapta a móvil.
- **#26 Políticas:** el bloque "Qué debes saber" ocupa el 100% del ancho del contenedor del detalle. El título está subrayado y las políticas van en 3 columnas (2 en tablet, 1 en móvil), cada una con título y descripción. El admin las carga y edita en *Agregar/Editar producto*.
- **#27 Compartir:** el botón compartir del detalle abre una ventana con la imagen, una descripción breve y el enlace directo (con botón *Copiar enlace*). Se elige la red (Facebook, X/Twitter, WhatsApp o Instagram) y se puede editar un mensaje personalizado. Al compartir:
  - Facebook, X y WhatsApp abren su página oficial de compartir con el mensaje y el enlace.
  - Instagram no permite compartir enlaces desde la web: se copia el texto y el enlace y se abre Instagram.
- **#28 Valoraciones:**
  - **Quién puede valorar:** solo quien tiene una **reserva finalizada** del producto. Otros usuarios ven por qué no pueden; los anónimos, la invitación a iniciar sesión.
  - **Cómo se valora:** de 1 a 5 estrellas, con un comentario opcional. Cada usuario tiene una valoración por producto y puede editarla.
  - **Qué muestra cada reseña:** estrellas, nombre, fecha y comentario.
  - **Media y cantidad:** se recalculan con cada valoración y se ven en el encabezado del detalle, en la sección de valoraciones y en las tarjetas, incluidos los resultados de búsqueda.
- **#29 Eliminar categoría:** en *Lista de categorías*, cada fila tiene el botón **"Eliminar categoría"** y se muestra la cantidad de productos de cada una. Antes de borrar aparece una ventana con:
  - el nombre de la categoría;
  - la consecuencia: cuántos productos quedarán sin categoría (los productos no se borran);
  - el aviso "Esta acción no se puede deshacer";
  - los botones **Cancelar** y **Confirmar**.

## 4. Decisiones técnicas

- **Reservas como base del sprint:** se agregó la entidad `Reservation`. Una reserva ocupa las noches desde la entrada hasta el día anterior a la salida, así que el día de salida puede ser la entrada de otra reserva. La creación de reservas desde la web queda para el próximo sprint. Por ahora se cargan **reservas de ejemplo relativas a la fecha actual**: futuras, para ver fechas ocupadas, y finalizadas, para poder valorar.
- **Usuario de demostración:** `usuario@reservaya.com` / `Usuario1234`, con reservas finalizadas del Hotel Mirador del Lago, el Auto Compacto Automático y el Departamento Centro Histórico. El admin ya dejó una reseña de 5 estrellas en el hotel.
- **Búsqueda en memoria:** se filtra y puntúa en Java sobre todos los productos. Es simple y suficiente para el volumen del MVP; con más datos convendría índice de texto completo.
- **Media guardada en el producto** (`ratingAverage`, `ratingCount`): se recalcula al guardar cada valoración. Así los listados muestran la puntuación sin consultas extra.
- **Favoritos con estado global en el frontend** (`FavoritesContext`) y actualización optimista: el corazón responde al instante y vuelve atrás si el servidor falla.
- **Borrado de productos en cascada:** al eliminar un producto se borran sus reservas, valoraciones y favoritos.
- **Calendario propio** (`DoubleCalendar`), sin dependencias: lo usan el buscador (rango) y el detalle (disponibilidad).
- **Migración:** una base existente del Sprint 2 recibe el usuario demo, las políticas y las reservas de ejemplo al arrancar, sin perder datos. Se verificó con la base de las pruebas anteriores.

## 5. Pruebas

Resultado: **170/170 OK**:
- 67 JUnit del backend;
- 55 end-to-end del Sprint 3;
- 48 end-to-end del Sprint 2, como regresión.

Detalle en [`pruebas/plan-de-pruebas-sprint-3.md`](pruebas/plan-de-pruebas-sprint-3.md).
