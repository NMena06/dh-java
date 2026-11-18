# Plan de pruebas - Sprint 4 (ReservaYa)

Rol: TL Testing. Cobertura: historias #30 a #35 del Sprint 4, más regresión de los sprints anteriores.

## Estrategia

1. **Pruebas unitarias de backend** (JUnit 5 + Mockito): reglas de la reserva (`ReservationServiceTest`) y contenido y envío del correo (`EmailServiceTest`).
2. **Prueba de integración** (`Sprint4IntegrationTest`): Spring Boot completo con seguridad real y H2 en memoria. Cubre crear, ver y listar reservas, errores, permisos y **concurrencia** (4 reservas simultáneas de las mismas fechas).
3. **Pruebas end-to-end en navegador** (`docs/pruebas/e2e/run-sprint4.js`): Playwright con Microsoft Edge en escritorio (1366px), tablet (820px) y móvil (390px). Capturas en `docs/pruebas/capturas/sprint4/` y resultados en `docs/pruebas/e2e/resultados-sprint4.json`. El correo (#35) se verifica en el log del backend (sin SMTP configurado).
4. **Regresión:** todas las pruebas JUnit y los E2E de los sprints 2 y 3.

Leyenda: **OK** cumple, **FALLA** no cumple.

## Resumen de resultados

| Tipo | Pruebas | Resultado |
|---|---|---|
| JUnit (todas) | 80 | OK (80/80) |
| — de ellas, nuevas del Sprint 4 | 13 | OK |
| End-to-end Sprint 4 (`run-sprint4.js`) | 40 | OK (40/40) |
| End-to-end Sprint 3, regresión | 55 | OK (55/55) |
| End-to-end Sprint 2, regresión | 48 | OK (48/48) |
| **Total ejecutado** | **223** | **OK (223/223)** |

Entorno: JDK 17.0.21 (Temurin), Maven 3.9.9, Node 24, Microsoft Edge (canal `msedge`), playwright-core.

## Casos de prueba por historia

### #30 Reservas: seleccionar fecha

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 30.1 | Botón "Reservar" en el detalle | Visible | OK |
| 30.2 | Clic sin sesión | Redirige al login | OK |
| 30.3 | Texto del login | Indica que el login es obligatorio y que debe registrarse si no tiene cuenta (con enlace) | OK (`login-obligatorio.png`) |
| 30.4 | Ubicación del aviso | En la parte superior, antes del formulario | OK |
| 30.5 | Iniciar sesión desde ese aviso | Vuelve a la página de reserva del producto | OK |
| 30.6 | Clic con sesión | Va directo a la página de reserva | OK |
| 30.7 | Elegir fechas en el detalle y "Reservar estas fechas" | Las fechas llegan cargadas a la reserva | OK |
| 30.8 | Buscar por fecha en el home | Lista solo los productos disponibles (el hotel ocupado no aparece) | OK |
| 30.9 | Elegir un rango en el calendario de la reserva | Se escribe en "Fecha de entrada" y "Fecha de salida" | OK |
| 30.10 | Rango que incluye fechas reservadas | No se acepta; esas fechas se ven ocupadas | OK |

### #31 Reservas: visualizar detalles

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 31.1 | Detalle del producto | Título, ubicación, imagen, descripción e información destacada | OK (`pagina-reserva.png`) |
| 31.2 | Detalles adicionales | Políticas del producto | OK |
| 31.3 | Datos del usuario | Nombre, apellido y correo del usuario logueado | OK |
| 31.4 | Ampliar datos | Teléfono, personas y comentarios (opcionales) | OK |
| 31.5 | Confirmación | Botón "Confirmar reserva" | OK |
| 31.6 | Período seleccionado | Se ve en el resumen con las noches | OK |
| 31.7 | Móvil (390px) | Sin desbordamiento | OK (`movil-reserva.png`) |

### #32 Realizar reserva

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 32.1 | Confirmar sin fechas | "Elige la fecha de entrada y la de salida en el calendario." | OK |
| 32.2 | Teléfono inválido | Error específico en el campo | OK |
| 32.3 | Reserva válida | Página "¡Reserva realizada con éxito!" con código | OK (`confirmacion-reserva.png`) |
| 32.4 | Datos no obligatorios | Teléfono, personas y comentarios en la confirmación | OK |
| 32.5 | Otra persona reserva las mismas fechas antes de confirmar | Mensaje específico y cómo solucionarlo | OK (`reserva-error.png`) |
| 32.6 | Tras ese error | El calendario se actualiza con las fechas tomadas | OK |
| 32.7 | API: fecha pasada / salida ≤ entrada / más de 90 noches | 400 con mensaje específico | OK (`ReservationServiceTest`, `Sprint4IntegrationTest`) |
| 32.8 | API: sin sesión | 401 | OK (`Sprint4IntegrationTest`) |
| 32.9 | API: 4 reservas simultáneas de las mismas fechas | Una 201 y tres 409 | OK (`Sprint4IntegrationTest`) |
| 32.10 | API: ver una reserva de otro usuario | 404 | OK (`Sprint4IntegrationTest`) |

### #33 Acceder a historial

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 33.1 | Menú del avatar → "Mis reservas" | La reserva nueva aparece en la lista | OK (`mis-reservas.png`) |
| 33.2 | Datos de cada reserva | Producto, fecha de reserva y fechas de uso | OK |
| 33.3 | Orden | Por fecha de uso, la más reciente primero | OK |
| 33.4 | Filtro "Anteriores" | Solo reservas finalizadas | OK |
| 33.5 | Móvil | Sin desbordamiento | OK (`movil-mis-reservas.png`) |
| 33.6 | Estado según la fecha | Próxima, En curso o Finalizada | OK (`ReservationServiceTest`) |

### #34 WhatsApp: iniciar chat

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 34.1 | Escritorio (1366px) | Botón fijo abajo a la derecha (16px de cada borde) | OK |
| 34.2 | Tablet (820px) | Ídem | OK |
| 34.3 | Móvil (390px) | Ídem | OK (`whatsapp-movil.png`) |
| 34.4 | Sin sesión, desde un producto | Abre el chat con un mensaje que menciona el producto | OK |
| 34.5 | Privacidad | Aviso de que el mensaje no se guarda | OK |
| 34.6 | Mensaje vacío | Error informativo | OK |
| 34.7 | Sin conexión | "No hay conexión a internet…" | OK |
| 34.8 | Enviar | Abre `wa.me/<número>?text=<mensaje>` | OK |
| 34.9 | Notificación de éxito | "¡Listo! Abrimos WhatsApp con tu mensaje…" | OK (`whatsapp.png`) |

### #35 Confirmar reserva por correo

| ID | Caso | Resultado esperado | Resultado |
|---|---|---|---|
| 35.1 | Confirmación en pantalla | Incluye el contacto del proveedor | OK |
| 35.2 | Al reservar | Se genera el correo dirigido al correo del registro | OK (log del backend) |
| 35.3 | Contenido | Producto, fechas, fecha y hora de la reserva y contacto del proveedor | OK (log del backend) |
| 35.4 | Con SMTP | Se envía como HTML (adaptable a móviles) al correo del usuario | OK (`EmailServiceTest`) |
| 35.5 | Datos del usuario en el HTML | Se escapan (no se inyecta HTML) | OK (`EmailServiceTest`) |
| 35.6 | Falla el SMTP | La reserva se confirma igual | OK (`EmailServiceTest`) |

## Hallazgos

1. **Orden entre pruebas de integración.** Una aserción suponía que la reserva recién creada sería la primera del historial, pero la prueba de concurrencia, que corrió antes, había creado una más lejana. El orden de la aplicación era correcto; se ajustó la prueba para verificar el orden en sí. **Cerrado.**
2. **Logo del footer.** El texto oscuro del logo no se veía sobre el fondo oscuro. Se agregó una variante clara (`logo-light.svg`). **Corregido.**

## Limitaciones

- El correo real requiere configurar SMTP (`MAIL_HOST` y demás). En las pruebas se verificó con el log y con un `JavaMailSender` simulado.
- WhatsApp se abre con un número de ejemplo que hay que reemplazar en `VITE_WHATSAPP_NUMBER`. No se puede confirmar si el usuario finalmente pulsa "Enviar" dentro de WhatsApp: la notificación confirma que se abrió el chat con el mensaje.
- El bloqueo contra dobles reservas es por instancia: con varias instancias del backend haría falta un bloqueo en la base de datos.
- Solo se probó en Microsoft Edge; móvil y tablet, con viewport.

## Cómo reproducir

```bash
cd backend && mvn test                      # 80 pruebas JUnit
# Con backend (:8080) y frontend (:5173) corriendo:
cd docs/pruebas/e2e
npm install playwright-core
BACKEND_LOG=<log del backend> node run-sprint4.js   # 40 casos (sin BACKEND_LOG se omite 35.2-35.3)
node run-sprint3.js && node run-sprint2.js          # regresión
```
