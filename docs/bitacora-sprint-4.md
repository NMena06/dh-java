# Bitácora - Sprint 4 (ReservaYa)

## 1. Definición del proyecto

**Solución:** ReservaYa es una aplicación web de reservas (hoteles, vuelos, alquileres de moda y autos) con manejo de disponibilidad. En el Sprint 4 se completa el circuito de **reserva de productos**:

1. buscar por fechas;
2. reservar desde el detalle, con login obligatorio;
3. confirmar en una página de reserva con los datos del producto y del usuario;
4. ver la confirmación y el historial;
5. recibir el correo con los datos de la reserva.

También se suma el contacto con el proveedor por WhatsApp.

**Meta del sprint:** desarrollar la funcionalidad de reserva de productos.

**Stack:** Java 17, Spring Boot 3.2.1 (Web, Data JPA, Security, Validation, Mail), H2; React 18, Vite 5, React Router 6. Repositorio: GitHub `NMena06/dh-java`.

## 2. Roles

| Rol | Responsable |
|---|---|
| Scrum Master | NMena06 |
| TL Testing | NMena06 |
| TL Frontend | NMena06 |
| TL Backend | NMena06 |
| TL BBDD | NMena06 |
| TL Infra | NMena06 |

## 3. Historias de usuario

| # | Historia | Prioridad | Estado |
|---|---|---|---|
| 30 | Reservas: seleccionar fecha | Alta | Completada |
| 31 | Reservas: visualizar detalles | Alta | Completada |
| 32 | Realizar reserva | Alta | Completada |
| 33 | Acceder a historial | Media | Completada |
| 34 | WhatsApp: iniciar chat | Baja | Completada |
| 35 | Notificación: confirmar reserva por correo | Baja | Completada (envío real con SMTP configurado; si no, al log) |

### Cómo se cumple cada historia

- **#30 Seleccionar fecha:**
  - **Acceso desde el detalle:** hay un botón **"Reservar"** visible en el bloque "¿Te interesa este producto?" y otro, **"Reservar estas fechas"**, junto al calendario de disponibilidad.
  - **Verificación de sesión:** con sesión, el botón lleva a `/productos/{id}/reservar`; sin sesión, al login.
  - **Aviso en el login:** arriba del formulario dice *"Para reservar es obligatorio iniciar sesión. Si todavía no tienes una cuenta, primero debes registrarte"*, con un enlace al registro. Después de iniciar sesión (o de registrarse y entrar), el usuario vuelve a la reserva.
  - **Búsqueda por fecha:** se hace desde el buscador del home (Sprint 3), que lista solo los productos disponibles en esas fechas.
  - **Fechas en el formulario:** el rango elegido en el calendario doble se escribe en los campos "Fecha de entrada" y "Fecha de salida".
  - **Fechas ocupadas:** el calendario no permite rangos que las incluyan, y el servidor lo vuelve a verificar.
- **#31 Página de reserva:**
  - **Detalle del producto:** título, ubicación (campo nuevo), imagen principal y miniaturas, categoría, puntuación, descripción, características destacadas y políticas.
  - **Datos del usuario:** nombre, apellido y correo, de solo lectura, más **datos opcionales para ampliar**: teléfono, cantidad de personas y comentarios.
  - **Período elegido:** se ve en el formulario y en el resumen, con la cantidad de noches.
  - Botón **"Confirmar reserva"**.
- **#32 Realizar reserva:**
  - Al confirmar se muestra la **página de confirmación** "¡Reserva realizada con éxito!", con el código (`RY-000033`), todos los datos (incluidos los opcionales) y el contacto del proveedor.
  - **Errores específicos con la solución:** fechas faltantes, teléfono inválido, cantidad de personas fuera de rango, fechas tomadas por otra persona mientras se completaba el formulario (el calendario se actualiza solo), sesión vencida y servidor no disponible.
- **#33 Historial:** la sección **"Mis reservas"** (menú del avatar y *Mi cuenta*) lista las reservas **ordenadas por fecha de uso**, de la más reciente a la más antigua. Cada una muestra:
  - estado (Próxima, En curso o Finalizada);
  - código;
  - producto y ubicación;
  - fechas de uso y noches;
  - fecha en que se hizo la reserva;
  - cantidad de personas.

  Tiene filtros Todas, Próximas y Anteriores.
- **#34 WhatsApp:**
  - **Ubicación:** botón flotante **abajo a la derecha**, fijo en todas las páginas y resoluciones (verificado en escritorio, tablet y móvil). No requiere sesión.
  - **Uso:** abre un panel para escribir la consulta, que ya menciona el producto si se está en un detalle, y abre WhatsApp (`wa.me`) con el número del proveedor y el mensaje.
  - **Éxito:** muestra una confirmación al abrir WhatsApp.
  - **Errores con mensaje informativo:** mensaje vacío, sin conexión, número configurado inválido y ventana bloqueada por el navegador (con enlace alternativo).
  - **Privacidad:** el panel aclara que el mensaje no pasa por los servidores de ReservaYa ni se guarda.
- **#35 Correo de reserva:**
  - **Cuándo y a quién:** se envía automáticamente al confirmar, justo después de guardar, al correo con el que el usuario se registró.
  - **Contenido:** código, producto, ubicación, entrada, salida, noches, datos opcionales, **fecha y hora en que se hizo la reserva** y **contacto del proveedor**, más un enlace a "Mis reservas".
  - **Formato:** HTML adaptable a móviles, con versión de texto plano.
  - **Sin SMTP:** el correo se escribe en el log del backend.

## 4. Documentación final (guía de entrega)

El README se reescribió siguiendo la *Guía de Documentación para la entrega final*:
- título y descripción;
- tecnologías con versiones;
- instalación local paso a paso;
- base de datos `reservaya` y variables de entorno (`backend/.env.example` y `frontend/.env.example`);
- endpoints agrupados con columna Auth;
- **diagrama de base de datos** ([`diagrama-bd.png`](diagrama-bd.png), hecho a partir del esquema real de H2);
- comandos de testing;
- estado del deploy;
- capturas;
- decisiones técnicas.

## 5. Decisiones técnicas

- **Reservas sin superposición, incluso en simultáneo:** la verificación y el guardado se hacen dentro de un bloqueo por producto y una transacción que se confirma antes de liberarlo. La prueba `reservasSimultaneas_soloUnaSeConfirma` lanza 4 reservas iguales a la vez y confirma que solo una se crea.
- **El correo se envía después del commit:** un fallo de SMTP no deshace la reserva.
- **DTO de reserva** (`ReservationResponse`): no expone entidades. El estado (Próxima, En curso, Finalizada) se calcula según la fecha actual.
- **Configuración externa:** el backend lee `backend/.env` con `spring.config.import`, y todas las propiedades tienen un valor por defecto. Se agregaron CORS y contacto del proveedor configurables. El frontend acepta `VITE_API_URL`, `VITE_APP_NAME` y `VITE_WHATSAPP_NUMBER`.
- **Logo del footer:** se agregó una variante clara del logo para el fondo oscuro.

## 6. Pruebas

Resultado: **223/223 OK**:
- 80 JUnit;
- 40 end-to-end del Sprint 4;
- regresión: 55 E2E del Sprint 3 y 48 del Sprint 2.

Detalle en [`pruebas/plan-de-pruebas-sprint-4.md`](pruebas/plan-de-pruebas-sprint-4.md).
