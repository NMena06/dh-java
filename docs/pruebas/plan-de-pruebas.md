# Plan de pruebas - Sprint 1 (ReservaYa)

Rol: TL Testing. Cobertura: historias #1 a #11 del Sprint 1.

## Estrategia

1. **Pruebas automatizadas (backend):** JUnit 5 + Mockito (servicio) y MockMvc (controlador). Se ejecutan con `mvn test`.
2. **Pruebas de API:** llamadas HTTP reales contra el backend en ejecución.
3. **Pruebas de interfaz:** revisión visual en navegador (capturas en `docs/pruebas/capturas/`).

Leyenda de resultados: **OK** cumple, **FALLA** no cumple, **PENDIENTE** no verificado todavía.

## Resultados de pruebas automatizadas

Ejecución: `mvn test` con JDK 17.0.20 y Maven 3.10.0.

| Clase | Pruebas | Resultado |
|---|---|---|
| `ProductServiceTest` | 9 | OK (9/9) |
| `ProductControllerTest` | 7 | OK (7/7) |
| **Total** | **16** | **OK (16/16)** |

## Casos de prueba por historia

### #1 Encabezado

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| 1.1 | Ver header en home | Logo y lema a la izquierda, botones "Crear cuenta" e "Iniciar sesión" a la derecha | OK | `home-footer.png` |
| 1.2 | Header fijo al hacer scroll | Permanece arriba (`position: fixed`) | OK (por CSS) | Revisión de código |
| 1.3 | Clic en logo redirige al inicio | Navega a `/` | OK (por código: `Link to="/"`) | Revisión de código |
| 1.4 | Responsive en móvil | Header se reorganiza en columna | PENDIENTE | El navegador headless no permite ancho menor a ~500px; ver nota |

### #2 Cuerpo del sitio (Main)

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| 2.1 | Fondo de marca | Color de la paleta | OK | `home-footer.png` |
| 2.2 | Alto 100% de pantalla | `min-height: 100vh` | OK (por CSS) | Revisión de código |
| 2.3 | Tres bloques visibles | Buscador, categorías y recomendaciones | OK | `home-footer.png` |

### #3 Registrar producto

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| 3.1 | Crear producto válido (API) | 201 y producto guardado | OK | Prueba de API + `ProductControllerTest` |
| 3.2 | Nombre duplicado (API) | 409 con mensaje "ya está en uso" | OK | Prueba de API + `ProductControllerTest` |
| 3.3 | Campos obligatorios vacíos | 400 con mensaje | OK | `ProductControllerTest` |
| 3.4 | Formulario en el panel | Campos nombre, descripción e imagen; mensaje de error | PENDIENTE (UI) | Formulario implementado, falta prueba en navegador |
| 3.5 | Subir varias imágenes | Múltiples archivos aceptados | PENDIENTE (UI) | Input `multiple` implementado |

### #4 Productos aleatorios en el home

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| 4.1 | Máximo 10 productos | Como máximo 10 | OK | `ProductControllerTest.random_limitaA10` |
| 4.2 | Sin repetidos | Sin nombres repetidos | OK | `ProductServiceTest.findRandom_devuelveLimiteSinRepetidos` |
| 4.3 | Orden variable | No siempre el mismo orden | OK | `ProductServiceTest.findRandom_noSiempreEsElMismoOrden` |
| 4.4 | Distribución 2 columnas | 2 columnas en escritorio | OK | `home-footer.png` |

### #5 Detalle de producto

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| 5.1 | Encabezado a 100% de ancho | Barra del título ocupa todo el ancho | OK | `capturas/detalle-producto.png` |
| 5.2 | Título a la izquierda | Alineado a la izquierda | OK | `capturas/detalle-producto.png` |
| 5.3 | Flecha a la derecha | Icono SVG alineado a la derecha, vuelve atrás | OK | `capturas/detalle-producto.png` |
| 5.4 | Texto e imágenes en el body | Descripción y galería | OK | `capturas/detalle-producto.png` |
| 5.5 | Producto inexistente | Mensaje de error | OK (API 404; UI muestra el mensaje) | Prueba de API |

### #6 Galería de imágenes

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| 6.1 | Imagen principal a la izquierda | Mitad izquierda | OK | `capturas/detalle-producto.png` |
| 6.2 | Grilla 2x2 a la derecha | 4 miniaturas | OK | `capturas/detalle-producto.png` |
| 6.3 | "Ver más" con menos de 5 imágenes | Botón oculto | OK (producto con 3 imágenes, sin botón) | `capturas/detalle-producto.png` |
| 6.4 | "Ver más" con 5 o más imágenes | Botón visible y modal con todas | PENDIENTE | No hay producto con 5+ imágenes en los datos de prueba |
| 6.5 | Responsive | Una columna en móvil | PENDIENTE | Mismo límite del navegador headless |

### #7 Footer

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| 7.1 | Footer en el DOM | Presente en la página | OK | Verificado con `--dump-dom` |
| 7.2 | Logo, año y copyright | Isologotipo, `© 2026 ReservaYa` | OK | DOM |
| 7.3 | Visible al hacer scroll | Al final de la página | OK (por ubicación; el `main` ocupa 100% de alto) | Revisión de código |

### #8 Paginación

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| 8.1 | Página de máximo 10 | `size` limitado a 10 | OK | Prueba de API `/page?size=50` (límite aplicado) |
| 8.2 | Contador y navegación | Botones de páginas y Anterior/Siguiente | OK (API); PENDIENTE (UI) | `findPage` probado en `ProductServiceTest.findPage_devuelveMetadatosDePaginacion` |
| 8.3 | Inicio / Anterior / Siguiente | Botones se deshabilitan en extremos | PENDIENTE (UI) | Implementado, falta prueba en navegador |

### #9 Panel de administración

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| 9.1 | URL `/administracion` | Carga el panel | OK | `admin-panel.png` |
| 9.2 | Menú de funciones | Botones "Agregar producto" y "Lista de productos" | OK | `admin-panel.png` |
| 9.3 | No responsive (móvil) | Aviso de no disponible | PENDIENTE | Mismo límite del navegador headless |

### #10 Listar productos

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| 10.1 | Botón "Lista de productos" | Abre `/administracion/productos` | OK | `admin-panel.png` |
| 10.2 | Columnas Id, Nombre, Acciones | Tabla con esas columnas | OK | `admin-lista.png` |
| 10.3 | Lista completa | Todos los productos | OK | `admin-lista.png` |

### #11 Eliminar producto

| ID | Caso | Resultado esperado | Resultado | Evidencia |
|---|---|---|---|---|
| 11.1 | Acción "Eliminar producto" por fila | Botón en cada fila | OK | `admin-lista.png` |
| 11.2 | Confirmación antes de borrar | Diálogo de confirmación | PENDIENTE (UI) | Implementado con `window.confirm`; falta prueba en navegador |
| 11.3 | Borrado en base de datos | DELETE responde 204 y el producto desaparece | OK | Prueba de API (DELETE 204) + `ProductControllerTest.eliminar_responde204` |
| 11.4 | Producto eliminado no aparece | GET de id eliminado devuelve 404 | OK | Prueba de API (GET posterior 404) |
| 11.5 | Cancelar no cambia nada | Sin llamada a la API | OK por código | Revisión de código (`if (!confirmed) return`) |

## Hallazgos

1. **Producto con id 1 desaparecido.** Durante las pruebas, el producto de ejemplo con id 1 ("Hotel Mirador del Lago") dejó de existir en la base H2. No encontré la causa en el código: la lógica de borrado solo se ejecuta desde la API o la interfaz, y no borré ese id intencionalmente. Se recomienda revisar la base y reiniciar con `backend/data/` vacío para regenerar la semilla.
2. **Límite de la prueba responsive.** El navegador headless (Edge) no permite ventanas menores de ~500px, así que la verificación de móvil (#1.4, #6.5, #9.3) queda pendiente. Se debe completar con las herramientas de desarrollo del navegador.
3. **Codificación.** Las tildes se ven correctamente en la API y la interfaz; los caracteres extraños solo aparecen en la consola de PowerShell.

## Pendientes para cerrar el sprint

- Probar en navegador: formulario de alta (3.4, 3.5), paginación (8.2, 8.3), confirmación de borrado (11.2), galería con 5+ imágenes (6.4) y todas las vistas responsive (1.4, 6.5, 9.3).
- Agregar un producto con 5 o más imágenes para validar la galería completa.
