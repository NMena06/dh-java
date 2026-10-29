# Plan de pruebas - Sprint 1 (ReservaYa)

Rol: TL Testing. Cobertura: historias #1 a #11 del Sprint 1.

## Estrategia

1. **Pruebas automatizadas de backend:** JUnit 5 + Mockito (servicio) y MockMvc (controlador). Ejecución: `mvn test`.
2. **Pruebas de API:** llamadas HTTP reales contra el backend en ejecución.
3. **Pruebas de interfaz end-to-end:** script Playwright (`docs/pruebas/e2e/run.js`) que usa Microsoft Edge instalado, recorre la aplicación en escritorio (1366px) y móvil (390px), y genera capturas en `docs/pruebas/capturas/`. Resultados en `docs/pruebas/e2e/resultados.json`.

Leyenda: **OK** cumple, **FALLA** no cumple.

## Resumen de resultados

| Tipo | Pruebas | Resultado |
|---|---|---|
| JUnit (`ProductServiceTest`, `ProductControllerTest`) | 16 | OK (16/16) |
| End-to-end en navegador (`run.js`) | 27 | OK (27/27) |
| **Total** | **43** | **OK (43/43)** |

Entorno: JDK 17.0.20 (Temurin), Maven 3.10.0, Node 22.17.0, Microsoft Edge (canal `msedge`), Playwright-core.

## Casos de prueba por historia

### #1 Encabezado

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 1.1 | Header con logo y botones "Crear cuenta" / "Iniciar sesión" | Presentes | OK |
| 1.2 | Header fijo al hacer scroll | `position: fixed` | OK |
| 1.3 | Clic en logo redirige al inicio | URL `/` | OK |
| 1.4 | Móvil (390px) sin desbordamiento | Exceso horizontal 0px | OK |

### #2 Cuerpo del sitio (Main)

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 2.1 | Fondo con color de marca | Paleta de `docs/identidad/paleta.md` | OK (`home-footer.png`) |
| 2.2 | Alto 100% de pantalla | `min-height: 100vh` | OK (revisión de código) |
| 2.3 | Tres bloques: buscador, categorías, recomendaciones | Visibles | OK (`home-footer.png`) |

### #3 Registrar producto

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 3.1 | Guardar producto desde el formulario | Redirige a la lista | OK |
| 3.2 | Producto aparece en el listado | Visible en la tabla | OK |
| 3.3 | Campos obligatorios vacíos (API) | 400 con mensaje | OK (`ProductControllerTest`) |
| 3.4 | Nombre duplicado (sin distinguir mayúsculas) | Mensaje "ya esta en uso" en pantalla | OK (`form-duplicado.png`) |
| 3.5 | Subir varias imágenes | Se aceptan 5 archivos | OK |

### #4 Productos aleatorios en el home

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 4.1 | Máximo 10 productos | 10 o menos | OK (10) |
| 4.2 | Sin repetidos | Nombres únicos | OK (`ProductServiceTest`) |
| 4.3 | Orden no fijo | Distinto orden entre llamadas | OK (`ProductServiceTest`) |
| 4.4 | 2 columnas en escritorio | 2 columnas | OK |

### #5 Detalle de producto

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 5.1 | Encabezado a 100% de ancho | Barra completa | OK (`detalle-producto.png`) |
| 5.2 | Título a la izquierda | Alineado a la izquierda | OK (`detalle-producto.png`) |
| 5.3 | Flecha a la derecha vuelve atrás | Regresa a la página anterior | OK |
| 5.4 | Descripción e imágenes en el body | Presentes | OK (`detalle-producto.png`) |

### #6 Galería de imágenes

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 6.1 | Imagen principal a la izquierda | Mitad izquierda | OK (`detalle-producto.png`) |
| 6.2 | Grilla 2x2 a la derecha | 4 miniaturas | OK (`detalle-producto.png`) |
| 6.3 | Sin "Ver más" con menos de 5 imágenes | Botón oculto | OK (`detalle-producto.png`, 3 imágenes) |
| 6.4 | "Ver más" con 5 imágenes | Botón visible | OK |
| 6.5 | Modal con todas las imágenes | 5 imágenes | OK (`galeria-modal.png`) |
| 6.6 | Modal se cierra | Sin modal | OK |
| 6.7 | Móvil sin desbordamiento | Exceso 0px | OK (`movil-detalle.png`) |

### #7 Footer

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 7.1 | Footer con logo y copyright | Presente | OK (`home-footer.png`) |
| 7.2 | Año y copyright | `© <año> ReservaYa` | OK |

### #8 Paginación

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 8.1 | Página 1 activa al cargar | Indicador en 1 | OK |
| 8.2 | Máximo 10 productos por página | 10 | OK |
| 8.3 | Siguiente cambia de página | Contenido distinto | OK (`paginacion.png`) |
| 8.4 | Anterior habilitado en página 2 | Habilitado | OK |
| 8.5 | Inicio vuelve a la página 1 | Página 1 | OK |
| 8.6 | Inicio deshabilitado en página 1 | Deshabilitado | OK |
| 8.7 | `size` mayor a 10 se limita | `size=10` | OK (API: `size=50` -> 10) |

### #9 Panel de administración

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 9.1 | URL `/administracion` | Carga el panel | OK (`admin-panel.png`) |
| 9.2 | Botones "Agregar producto" y "Lista de productos" | Presentes | OK |
| 9.3 | Móvil: aviso de no disponible | Aviso visible, contenido oculto | OK (`movil-admin.png`) |

### #10 Listar productos

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 10.1 | Columnas Id, Nombre, Acciones | Presentes | OK (`admin-lista.png`) |
| 10.2 | Lista completa de productos | Todos los productos | OK |

### #11 Eliminar producto

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 11.1 | Acción "Eliminar producto" por fila | Presente | OK |
| 11.2 | Cancelar confirmación no cambia nada | Lista sin cambios | OK |
| 11.3 | Aceptar elimina de la lista | Fila eliminada | OK |
| 11.4 | Producto eliminado no existe en API | 404 | OK |
| 11.5 | Eliminar en base de datos | DELETE 204 (`ProductControllerTest`, API) | OK |

## Hallazgos

1. **Producto con id 1 eliminado.** El producto id 1 desapareció durante las pruebas. Fue eliminado manualmente como parte de las pruebas de borrado, por lo que no es un defecto. **Cerrado.**
2. **Datos de prueba.** El script E2E crea productos "Servicio de prueba N" para probar la paginación, y un producto "Hotel Galeria Completa" con 5 imágenes que se elimina al final. Las imágenes de prueba son un PNG de 1x1 píxel estirado, por lo que las capturas muestran bloques de color.
3. **Codificación.** Las tildes se ven bien en la API y la interfaz. Los caracteres extraños solo aparecen en la consola de PowerShell.

## Limitaciones

- Las pruebas se ejecutaron en Microsoft Edge. No se probó en Firefox ni Safari.
- La prueba de móvil usa un viewport de 390px, no un dispositivo real.
- El panel de administración no tiene autenticación (fuera del alcance del Sprint 1).

## Cómo reproducir

```bash
# Backend en :8080 y frontend en :5173 corriendo
cd docs/pruebas/e2e
npm install playwright-core
node run.js
```
