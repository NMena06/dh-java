# Plan de pruebas - Sprint 3 (ReservaYa)

Rol: TL Testing. Cobertura: historias #22 a #29 del Sprint 3, más regresión de los sprints 1 y 2.

## Estrategia

1. **Pruebas unitarias de backend** (JUnit 5 + Mockito): relevancia y filtros de búsqueda (`ProductSearchServiceTest`) y reglas de valoración (`ReviewServiceTest`).
2. **Prueba de integración** (`Sprint3IntegrationTest`): Spring Boot completo con seguridad real, H2 en memoria y datos iniciales. Cubre búsqueda, sugerencias, disponibilidad, políticas, favoritos, valoraciones y borrado en cascada.
3. **Pruebas end-to-end en navegador** (`docs/pruebas/e2e/run-sprint3.js`): Playwright con Microsoft Edge en escritorio (1366px) y móvil (390px). Capturas en `docs/pruebas/capturas/sprint3/` y resultados en `docs/pruebas/e2e/resultados-sprint3.json`.
4. **Regresión:** se ejecutaron otra vez todas las pruebas JUnit y el E2E del Sprint 2.

Leyenda: **OK** cumple, **FALLA** no cumple.

## Resumen de resultados

| Tipo | Pruebas | Resultado |
|---|---|---|
| JUnit (todas, incluidas las de sprints anteriores) | 67 | OK (67/67) |
| — de ellas, nuevas del Sprint 3 | 16 | OK |
| End-to-end Sprint 3 (`run-sprint3.js`) | 55 | OK (55/55) |
| End-to-end Sprint 2, regresión (`run-sprint2.js`) | 48 | OK (48/48) |
| **Total ejecutado** | **170** | **OK (170/170)** |

Entorno: JDK 17.0.21 (Temurin), Maven 3.9.9, Node 24, Microsoft Edge (canal `msedge`), playwright-core.

## Casos de prueba por historia

### #22 Realizar búsqueda

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 22.1 | Título y párrafo descriptivo del bloque | Visibles | OK (`busqueda-sugerencias.png`) |
| 22.2 | Etiquetas claras y botón "Realizar búsqueda" | Presentes | OK |
| 22.3 | Escribir "hot" | Sugiere "Hoteles" y "Hotel Mirador del Lago" | OK |
| 22.4 | Coincidencia resaltada en la sugerencia | Texto "hot" marcado | OK |
| 22.5 | Elegir una sugerencia con flechas + Enter | Completa el campo y busca | OK |
| 22.6 | Buscar "lago" | La coincidencia en el nombre aparece primero | OK |
| 22.7 | Resumen de resultados | "N resultados para “lago”" | OK |
| 22.8 | Con resultados visibles | Categorías y recomendaciones siguen en el home | OK (`busqueda-resultados.png`) |
| 22.9 | Selector de fechas | Calendario doble (2 meses) | OK (`busqueda-calendario-doble.png`) |
| 22.10 | Días pasados | Deshabilitados | OK |
| 22.11 | Elegir entrada y salida | "2 noches" | OK |
| 22.12 | Buscar "hotel" en fechas reservadas | El hotel ocupado no aparece | OK |
| 22.13 | Búsqueda sin coincidencias | Mensaje claro | OK |
| 22.14 | "Limpiar búsqueda" | Oculta la sección de resultados | OK |
| 22.15 | Móvil (390px) | Calendario en una columna, sin desbordamiento | OK (`movil-busqueda.png`) |
| 22.16 | Sin tildes ni mayúsculas ("HISTORICO") | Encuentra "Histórico" | OK (`ProductSearchServiceTest`) |
| 22.17 | Varias palabras | Todas deben coincidir | OK (`ProductSearchServiceTest`) |
| 22.18 | Salida igual o anterior a la entrada / fecha inválida | 400 con mensaje | OK (`Sprint3IntegrationTest`) |

### #23 Visualizar disponibilidad

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 23.1 | Detalle del producto | Calendario doble | OK (`disponibilidad.png`) |
| 23.2 | Fechas reservadas | En rojo y tachadas; las libres en verde | OK |
| 23.3 | Leyenda | Disponible / Ocupado / Tu selección | OK |
| 23.4 | Rango que incluye noches ocupadas | No se acepta | OK |
| 23.5 | Rango libre | "2 noches disponibles" | OK |
| 23.6 | Falla la consulta (red cortada) | "No pudimos obtener la disponibilidad en este momento" | OK (`disponibilidad-error.png`) |
| 23.7 | Botón "Reintentar" | Vuelve a cargar el calendario | OK |
| 23.8 | Producto inexistente (API) | 404 | OK (`Sprint3IntegrationTest`) |

### #24 Marcar como favorito

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 24.1 | Corazón en cada producto del home | En todas las tarjetas | OK |
| 24.2 | Clic sin sesión | Lleva al login con aviso | OK |
| 24.3 | Clic con sesión | Se marca con un clic | OK (`favorito-marcado.png`) |
| 24.4 | Mismo producto en varias secciones | Todas las tarjetas reflejan el estado | OK |
| 24.5 | Marcar y desmarcar | Se guarda en el servidor | OK |
| 24.6 | Móvil | Marcar funciona | OK |
| 24.7 | API sin sesión | 401 | OK (`Sprint3IntegrationTest`) |
| 24.8 | Marcar dos veces (API) | No se duplica | OK (`Sprint3IntegrationTest`) |

### #25 Listar productos favoritos

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 25.1 | Menú del avatar → "Mis favoritos" | Lista los productos marcados | OK (`mis-favoritos.png`) |
| 25.2 | Desmarcar en el detalle y volver | La lista ya no lo muestra (sin recargar) | OK |
| 25.3 | "Quitar" desde la lista | Se elimina de la lista y del servidor | OK |
| 25.4 | Móvil | Sin desbordamiento | OK (`movil-favoritos.png`) |

### #26 Bloque de políticas

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 26.1 | Ancho del bloque | 100% del contenedor (1366/1366 px) | OK (`politicas.png`) |
| 26.2 | Título | Identificable y subrayado | OK |
| 26.3 | Distribución | 3 columnas | OK |
| 26.4 | Cada política | Título + descripción | OK |
| 26.5 | Políticas en la API | Incluidas en el detalle del producto | OK (`Sprint3IntegrationTest`) |

### #27 Compartir productos

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 27.1 | Botón compartir | Abre una ventana emergente | OK (`compartir.png`) |
| 27.2 | Contenido | Imagen, descripción breve y enlace directo | OK |
| 27.3 | Redes | Facebook, X (Twitter), WhatsApp, Instagram | OK |
| 27.4 | Elegir X y escribir un mensaje | Abre `twitter.com/intent/tweet` con el mensaje y el enlace | OK |
| 27.5 | Elegir Facebook | Abre `facebook.com/sharer` con el enlace | OK |
| 27.6 | Escape | Cierra la ventana | OK |

### #28 Puntuar producto

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 28.1 | Encabezado del detalle | Media y cantidad visibles | OK |
| 28.2 | Reseña existente | Estrellas, nombre, fecha y comentario | OK (`valoraciones.png`) |
| 28.3 | Anónimo | Invitación a iniciar sesión | OK |
| 28.4 | Usuario sin reserva finalizada | No ve el formulario; mensaje explicativo | OK |
| 28.5 | Usuario con reserva finalizada | Formulario de 1 a 5 estrellas | OK (`valorar-formulario.png`) |
| 28.6 | Publicar 4 estrellas + comentario | Aparece la reseña con nombre y fecha | OK (`valoracion-publicada.png`) |
| 28.7 | Media dinámica | Se actualiza al instante en el detalle | OK |
| 28.8 | Resultados de búsqueda | Muestran la media y la cantidad | OK |
| 28.9 | API: puntuación 6 / sin reserva | 400 / 403 | OK (`Sprint3IntegrationTest`) |
| 28.10 | Volver a valorar | Actualiza, no duplica | OK (`ReviewServiceTest`) |
| 28.11 | Media con varias valoraciones | Promedio correcto (2 y 5 → 3.5) | OK (`ReviewServiceTest`) |

### #29 Eliminar categoría

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 29.1 | Botón "Eliminar categoría" | Visible por fila en el panel | OK |
| 29.2 | Ventana de confirmación | Indica la categoría y que 1 producto quedará sin categoría | OK (`eliminar-categoria-confirmacion.png`) |
| 29.3 | Botones | "Confirmar" y "Cancelar" | OK |
| 29.4 | "Cancelar" | No elimina | OK |
| 29.5 | "Confirmar" | Elimina; el producto queda sin categoría | OK |

## Hallazgos

1. **Prueba con actualización optimista.** La primera ejecución dio 54/55: el caso 25.3 consultaba la API antes de que terminara el DELETE, porque la interfaz se actualiza antes que el servidor. Se espera la respuesta del servidor. No era un defecto. **Cerrado.**
2. **Días pasados con reserva.** El calendario mostraba en rojo un día pasado que había tenido reserva. Ahora los días pasados se ven siempre en gris. **Corregido.**
3. **Scroll al navegar.** Al pasar del home a "Mis favoritos" se conservaba el scroll y el título quedaba bajo el encabezado. Se agregó volver al inicio en cada cambio de página. **Corregido.**
4. **Concordancia.** El diálogo de borrado decía "1 producto … dejarán". **Corregido.**
5. **Textos sin tildes.** Las políticas de ejemplo no llevaban tildes. Se corrigieron para bases nuevas; una base existente conserva los textos ya cargados. **Corregido.**

## Limitaciones

- Las reservas son datos de ejemplo; la creación de reservas desde la web es parte del próximo sprint.
- Compartir en Instagram copia el texto y abre Instagram, porque la red no permite compartir enlaces desde la web. En las pruebas, las redes sociales se simularon localmente: se verificó la URL generada, no la publicación real.
- Solo se probó en Microsoft Edge; móvil y tablet, con viewport, no con dispositivos reales.

## Cómo reproducir

```bash
cd backend && mvn test           # 67 pruebas JUnit
# Con backend (:8080) y frontend (:5173) corriendo:
cd docs/pruebas/e2e
npm install playwright-core
node run-sprint3.js              # 55 pruebas en navegador
node run-sprint2.js              # 48 pruebas de regresión
```
