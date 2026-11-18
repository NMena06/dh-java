# Bitácora - Sprint 2 (ReservaYa)

## 1. Definición del proyecto

**Solución:** ReservaYa es una aplicación web de reservas (hoteles, vuelos, alquileres de moda y autos). Sobre el catálogo del Sprint 1, el Sprint 2 agrega usuarios (registro, inicio y cierre de sesión), permisos de administrador, categorías y características de producto.

**Meta del sprint:** desarrollar la estructura básica del login y registro de usuario, así como implementar el detalle de producto.

**Stack:**
- Backend: Java 17, Spring Boot 3.2.1, Spring Data JPA, Spring Security, Spring Mail, validación, H2 (archivo local).
- Frontend: React 18, Vite, react-router-dom.
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
| 12 | Categorizar productos | Alta | Completada |
| 13 | Registrar usuario | Alta | Completada |
| 14 | Identificar usuario | Alta | Completada |
| 15 | Cerrar sesión | Alta | Completada |
| 16 | Identificar administrador | Alta | Completada |
| 17 | Administrar características de producto | Media | Completada |
| 18 | Visualizar características del producto | Media | Completada |
| 19 | Notificación: confirmación de registro (opcional) | Desafío | Completada (envío real si se configura SMTP; si no, se escribe en el log) |
| 20 | Crear sección de categorías (filtro) | Baja | Completada |
| 21 | Agregar categoría | Baja | Completada |

### Cómo se cumple cada historia

- **#12:** el producto tiene una categoría opcional (`ManyToOne`). Se asigna al registrar o editar un producto, y también desde un selector en la *Lista de productos* del panel (`PATCH /api/products/{id}/category`).
- **#13:** formulario `/registro` con nombre, apellido, correo, contraseña y confirmación. Se valida en el navegador y en el backend con las mismas reglas:
  - nombre y apellido: de 2 a 50 letras (se aceptan tildes, espacios, apóstrofo y guion);
  - correo: formato válido y único, sin distinguir mayúsculas;
  - contraseña: de 8 a 64 caracteres, con al menos una letra y un número.

  Los errores aparecen debajo de cada campo.
- **#14:** `/login` con correo y contraseña. Si los datos son incorrectos, se muestra un mensaje claro que no revela si el correo existe. Con la sesión iniciada, el header muestra un avatar con las iniciales y el nombre completo, y se puede entrar a *Mi cuenta* (datos personales).
- **#15:** debajo del avatar se despliega el menú con *Cerrar sesión*. El token se borra en el servidor, así que deja de valer de inmediato. Las rutas protegidas redirigen al login y el usuario sigue navegando como anónimo.
- **#16:** roles `USER` y `ADMIN`. El panel `/administracion` y todos los endpoints de escritura exigen `ROLE_ADMIN`. En *Usuarios* se otorga o quita el permiso. El rol se lee de la base en cada petición, por lo que el cambio se aplica sin volver a iniciar sesión. Hay dos protecciones: un administrador no puede quitarse sus propios permisos, y no se puede quitar el último administrador.
- **#17:** *Administrar características* muestra el listado con Editar y Eliminar, y el botón *Añadir nueva* (nombre + ícono elegido de un set de 14 íconos SVG). En el formulario de producto se asocian una o más características.
- **#18:** el detalle del producto tiene el bloque **Características**, con un ícono por cada una. Es una grilla responsiva: 4 columnas en escritorio, 2 en tablet y 1 en móvil.
- **#19:** al registrarse se envía un correo con un mensaje de confirmación, el nombre, el correo y un enlace al login. En la pantalla de éxito está la opción *Reenviar correo de confirmación*.
- **#20:** en el home, las categorías vienen del backend. Un clic en una tarjeta o en los chips de *Filtrar por categoría* permite seleccionar una o varias. Se muestra "Mostrando X de Y productos" y el botón *Limpiar filtros*. El filtro funciona en el servidor (`/api/products/page?categoryIds=1,2`) y respeta la paginación.
- **#21:** *Agregar categoría* en el panel, con título, descripción e imagen representativa. Hay un listado de categorías con opción de eliminar; los productos de una categoría eliminada quedan sin categoría.

## 4. Decisiones técnicas

- **Autenticación con tokens opacos guardados en la base** (tabla `auth_tokens`, vigencia de 8 h) en lugar de JWT. Así, cerrar sesión invalida el token en el servidor (criterio "cierre de sesión efectivo") y el rol siempre está actualizado. El frontend envía `Authorization: Bearer <token>`.
- **Contraseñas con BCrypt**: nunca se devuelven en la API.
- **Administrador inicial:** se crea al arrancar si no hay usuarios (`admin@reservaya.com` / `Admin1234`, configurable en `application.properties`). Sin él no habría quién otorgue permisos.
- **Datos iniciales por tabla:** categorías, características y administrador se cargan solo si su tabla está vacía. Una base del Sprint 1 se actualiza sin perder productos (`ddl-auto=update`).
- **Imágenes de categorías de ejemplo** como SVG embebido (data URL), para no depender de servicios externos.
- **Íconos de características:** el backend guarda una clave (`wifi`, `pileta`, ...) y el frontend dibuja el SVG. Así el ícono no depende de archivos subidos.
- **Correo (#19):** se usa `spring-boot-starter-mail`. Si no hay SMTP configurado, el correo se escribe en el log del backend; un fallo de envío nunca bloquea el registro.
- **JSON del producto:** la categoría se serializa sin su imagen para no inflar los listados.

## 5. Pruebas

Resultado: **99/99 OK**: 51 JUnit (backend) y 48 end-to-end en navegador. Detalle en [`pruebas/plan-de-pruebas-sprint-2.md`](pruebas/plan-de-pruebas-sprint-2.md).
