# Plan de pruebas - Sprint 2 (ReservaYa)

Rol: TL Testing. Cobertura: historias #12 a #21 del Sprint 2.

## Estrategia

1. **Pruebas unitarias de backend** (JUnit 5 + Mockito): servicios de productos, categorías, características, autenticación, usuarios y correo.
2. **Prueba de integración** (`SecurityIntegrationTest`): Spring Boot completo con la seguridad real y H2 en memoria. Verifica permisos, registro, login, logout y el flujo de categorías y características vía HTTP.
3. **Pruebas end-to-end en navegador** (`docs/pruebas/e2e/run-sprint2.js`): Playwright con Microsoft Edge, en escritorio (1366px), tablet (820px) y móvil (390px). Capturas en `docs/pruebas/capturas/sprint2/` y resultados en `docs/pruebas/e2e/resultados-sprint2.json`.

Leyenda: **OK** cumple, **FALLA** no cumple.

## Resumen de resultados

| Tipo | Pruebas | Resultado |
|---|---|---|
| JUnit unitarias (`ProductServiceTest`, `ProductCatalogTest`, `AuthServiceTest`, `UserServiceTest`, `CategoryFeatureServiceTest`, `EmailServiceTest`) | 39 | OK (39/39) |
| JUnit controlador (`ProductControllerTest`) | 7 | OK (7/7) |
| JUnit integración (`SecurityIntegrationTest`) | 5 | OK (5/5) |
| End-to-end en navegador (`run-sprint2.js`) | 48 | OK (48/48) |
| **Total** | **99** | **OK (99/99)** |

Entorno: JDK 17.0.21 (Temurin), Maven 3.9.9, Node 24, Microsoft Edge (canal `msedge`), playwright-core.

## Casos de prueba por historia

### #12 Categorizar productos

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 12.1 | Registrar producto eligiendo una categoría | El producto queda con esa categoría | OK (`registrar-producto-categoria.png`) |
| 12.2 | Cambiar la categoría desde el selector de la *Lista de productos* | Se guarda al instante y muestra un aviso | OK (`lista-productos-categoria.png`) |
| 12.3 | *Editar producto* precarga la categoría y las características | Valores actuales seleccionados | OK |
| 12.4 | Cambiar la categoría desde *Editar producto* | Categoría actualizada | OK |
| 12.5 | Categoría inexistente (API) | 404 | OK (`ProductCatalogTest`) |
| 12.6 | Quitar la categoría (`categoryId: null`) | Producto sin categoría | OK (`ProductCatalogTest`) |

### #13 Registrar usuario

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 13.1 | "Crear cuenta" abre `/registro` | Formulario visible | OK |
| 13.2 | Enviar vacío | Error en nombre, apellido, correo y contraseña | OK |
| 13.3 | Nombre de 1 letra, apellido con números, correo sin dominio, contraseña corta | Mensaje específico por campo | OK (`registro-validaciones.png`) |
| 13.4 | Contraseñas distintas | "Las contraseñas no coinciden" | OK |
| 13.5 | Datos válidos | Pantalla "¡Registro exitoso!" con nombre y correo | OK (`registro-exitoso.png`) |
| 13.6 | Correo ya registrado (en mayúsculas) | "Ya existe una cuenta…" bajo el campo | OK |
| 13.7 | Las mismas validaciones en la API | 400 con `errors` por campo | OK (`SecurityIntegrationTest`) |
| 13.8 | Contraseña guardada con hash y datos normalizados ("ana maría" → "Ana María") | No se guarda en texto plano | OK (`AuthServiceTest`) |

### #14 Identificar usuario

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 14.1 | Contraseña incorrecta | "Correo electrónico o contraseña incorrectos…" | OK (`login-error.png`) |
| 14.2 | Login válido: avatar con iniciales | "AP" para Ana María Pérez | OK (`header-usuario.png`) |
| 14.3 | Login válido: nombre en el header | "Ana María Pérez" | OK |
| 14.4 | Se ocultan "Crear cuenta" / "Iniciar sesión" | No visibles | OK |
| 14.5 | *Mi cuenta* muestra los datos personales | Nombre, apellido y correo | OK |
| 14.6 | La sesión se mantiene al recargar | Avatar visible | OK |
| 14.7 | Header con avatar en móvil | Sin desbordamiento | OK (`movil-menu-usuario.png`) |
| 14.8 | Usuario inexistente | Mismo mensaje que con contraseña incorrecta | OK (`AuthServiceTest`) |

### #15 Cerrar sesión

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 15.1 | "Cerrar sesión" debajo del avatar | Menú desplegable bajo el avatar | OK (`menu-cerrar-sesion.png`) |
| 15.2 | Cerrar sesión | El header vuelve a mostrar "Crear cuenta" / "Iniciar sesión" | OK |
| 15.3 | El token anterior ya no vale | `/api/auth/me` responde 401 | OK |
| 15.4 | Entrar a *Mi cuenta* sin sesión | Redirige a `/login` | OK |
| 15.5 | Navegar como anónimo | El home carga los productos | OK |

### #16 Identificar administrador

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 16.1 | Usuario común entra a `/administracion` | "Acceso denegado" | OK (`acceso-denegado.png`) |
| 16.2 | El admin ve el panel con todas las secciones | 6 accesos | OK (`admin-panel.png`) |
| 16.3 | "Hacer administrador" desde el listado de usuarios | Rol Administrador | OK (`admin-usuarios.png`) |
| 16.4 | El admin no puede quitarse sus permisos | Botón deshabilitado y 409 en la API | OK |
| 16.5 | El nuevo admin accede al panel | Panel visible | OK |
| 16.6 | Quitar el permiso se aplica con el mismo token | API 403 | OK |
| 16.7 | Anónimo crea un producto / usuario común crea un producto | 401 / 403 | OK (`SecurityIntegrationTest`) |
| 16.8 | No se puede quitar el último administrador | 409 | OK (`UserServiceTest`) |

### #17 Administrar características

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 17.1 | Listado con Editar y Eliminar por fila | Presentes | OK (`lista-caracteristicas.png`) |
| 17.2 | "Añadir nueva" con nombre e ícono | Aparece en la lista con su ícono | OK (`nueva-caracteristica.png`) |
| 17.3 | Editar una característica | Nombre actualizado | OK |
| 17.4 | Asociar varias características a un producto | 6 asociadas | OK |
| 17.5 | Eliminar una característica | Se quita de la lista y del producto | OK |
| 17.6 | Nombre duplicado | 409 | OK (`CategoryFeatureServiceTest`) |

### #18 Visualizar características del producto

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 18.1 | Bloque con título "Características" | Presente | OK (`caracteristicas-desktop.png`) |
| 18.2 | Lista todas las características | 6 de 6 | OK |
| 18.3 | Cada característica con ícono | 6 SVG | OK |
| 18.4 | Escritorio (1366px) | 4 columnas, sin desbordamiento | OK |
| 18.5 | Tablet (820px) | 2 columnas, sin desbordamiento | OK (`caracteristicas-tablet.png`) |
| 18.6 | Móvil (390px) | 1 columna, sin desbordamiento | OK (`caracteristicas-movil.png`) |

### #19 Confirmación de registro (desafío opcional)

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 19.1 | "Reenviar correo de confirmación" | Mensaje "Te reenviamos el correo…" | OK |
| 19.2 | El correo incluye confirmación, nombre, correo y enlace al login | Contenido completo | OK (`EmailServiceTest`) |
| 19.3 | Se envía inmediatamente después del registro | `sendRegistrationConfirmation` en `register` | OK (`AuthServiceTest`, log del backend) |
| 19.4 | Sin SMTP el registro no falla | Correo en el log | OK (`EmailServiceTest`) |
| 19.5 | El reenvío no revela si el correo existe | Siempre responde 202 | OK (`AuthServiceTest`) |

### #20 Sección de categorías (filtro)

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 20.1 | Categorías del backend en el home y en el filtro | Tarjetas y chips | OK |
| 20.2 | Filtrar por una categoría | Solo sus productos | OK |
| 20.3 | Cantidad filtrada y total | "Mostrando 1 de 6 productos" | OK |
| 20.4 | Varias categorías | Suma los resultados | OK (`filtro-categorias.png`) |
| 20.5 | "Limpiar filtros" | Vuelve a la lista original | OK |
| 20.6 | Clic en una tarjeta de categoría | Aplica el filtro | OK |
| 20.7 | Móvil (390px) | Sin desbordamiento | OK (`filtro-movil.png`) |

### #21 Agregar categoría

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 21.1 | "Agregar categoría" con título, descripción e imagen | Aparece en la lista | OK (`agregar-categoria.png`, `lista-categorias.png`) |
| 21.2 | Título duplicado | 409 | OK (`SecurityIntegrationTest`) |
| 21.3 | Eliminar una categoría con productos | Los productos quedan sin categoría | OK (`SecurityIntegrationTest`) |

## Hallazgos

1. **Imágenes externas.** Las imágenes de ejemplo de picsum.photos no cargaban en el entorno de prueba. Las categorías de ejemplo pasaron a usar SVG embebido. Las imágenes de los productos de ejemplo siguen dependiendo de picsum. **Cerrado** para categorías.
2. **Sincronización en E2E.** La primera ejecución dio 46/48: el script contaba las filas de la tabla antes de que terminaran de cargar. Se agregaron esperas explícitas. No era un defecto de la aplicación. **Cerrado.**
3. **Codificación en consola.** Las tildes del correo se ven mal en la consola de Windows pero se guardan bien (UTF-8). No es un defecto.
4. **Sprint 1 E2E.** `run.js` buscaba "Crear cuenta" como botón; ahora es un enlace. Se actualizó el caso 1.1.

## Limitaciones

- Solo se probó en Microsoft Edge (motor Chromium); no en Firefox ni Safari.
- El envío real de correo depende de configurar un SMTP (ver README); en las pruebas se verificó con un `JavaMailSender` simulado y con el log.
- Las pruebas de móvil y tablet usan un viewport, no dispositivos reales.

## Cómo reproducir

```bash
cd backend && mvn test           # 51 pruebas JUnit
# Con backend (:8080) y frontend (:5173) corriendo:
cd docs/pruebas/e2e
npm install playwright-core
node run-sprint2.js              # 48 pruebas en navegador
```
