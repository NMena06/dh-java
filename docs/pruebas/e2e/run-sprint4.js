/**
 * Pruebas end-to-end del Sprint 4 (historias #30 a #35).
 * Requiere backend en :8080 (con los datos iniciales) y frontend en :5173. Uso:
 *   npm install playwright-core
 *   BACKEND_LOG=ruta/al/log/del/backend node run-sprint4.js   (el log es opcional, para verificar el correo #35)
 * Usa Microsoft Edge instalado (canal msedge). Capturas en docs/pruebas/capturas/sprint4.
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5173';
const API = 'http://localhost:8080/api';
const CAP = path.join(__dirname, '..', 'capturas', 'sprint4');
const DEMO = { email: 'usuario@reservaya.com', password: 'Usuario1234' };
const STAMP = Number(Date.now().toString().slice(-6));
// Fechas lejanas y distintas en cada ejecucion para no chocar con reservas de corridas anteriores
const OFFSET = 120 + (STAMP % 200);

fs.mkdirSync(CAP, { recursive: true });
const results = [];
const check = (id, desc, ok, detail = '') => {
  results.push({ id, desc, ok: !!ok, detail });
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${id} ${desc} ${detail}`);
};
const shot = (page, name, fullPage = false) => page.screenshot({ path: path.join(CAP, `${name}.png`), fullPage });
const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const plusDays = (n) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const longDate = (d) => `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;

async function api(method, url, token, body) {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: res.status === 204 ? null : await res.json() };
}

async function fillLogin(page, { email, password }) {
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}

async function pickDay(scope, date) {
  for (let i = 0; i < 14; i += 1) {
    const day = scope.locator(`.dcal-day[data-date="${iso(date)}"]`);
    if (await day.count()) return day.click();
    await scope.getByRole('button', { name: 'Mes siguiente' }).click();
  }
  throw new Error(`No se encontró el día ${iso(date)}`);
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const newContext = async (width, height) => {
    const ctx = await browser.newContext({ viewport: { width, height } });
    await ctx.route(/wa\.me|whatsapp\.com/, (route) => route.fulfill({ status: 200, body: 'ok' }));
    return ctx;
  };
  const newPage = async (w, h) => (await newContext(w, h)).newPage();

  const products = (await api('GET', '/products')).data;
  const vuelo = products.find((p) => p.name === 'Vuelo Buenos Aires - Bariloche');
  const hotel = products.find((p) => p.name === 'Hotel Mirador del Lago');
  const demoToken = (await api('POST', '/auth/login', null, DEMO)).data.token;

  // ---------------- #30 Seleccionar fecha / acceso a la reserva ----------------
  let page = await newPage(1366, 900);
  await page.goto(`${BASE}/productos/${vuelo.id}`, { waitUntil: 'networkidle' });
  const cta = page.locator('.reserve-cta').getByRole('button', { name: 'Reservar' });
  check('30.1', 'Botón "Reservar" visible en el detalle del producto', await cta.isVisible());
  await cta.click();
  await page.waitForURL('**/login');
  const notice = page.locator('.login-required');
  const noticeText = await notice.innerText();
  check('30.2', 'Sin sesión redirige al login', true);
  check('30.3', 'El login indica que es obligatorio y que debe registrarse si no tiene cuenta', noticeText.includes('obligatorio') && noticeText.includes('registrarte') && (await notice.getByRole('link', { name: 'registrarte' }).count()) === 1);
  const noticeBox = await notice.boundingBox();
  const emailBox = await page.getByLabel('Correo electrónico').boundingBox();
  check('30.4', 'El aviso está en la parte superior del login', noticeBox.y < emailBox.y);
  await shot(page, 'login-obligatorio');
  await fillLogin(page, DEMO);
  await page.waitForURL(`**/productos/${vuelo.id}/reservar`);
  check('30.5', 'Tras iniciar sesión vuelve a la página de reserva del producto', true);

  await page.goto(`${BASE}/productos/${vuelo.id}`, { waitUntil: 'networkidle' });
  await page.locator('.reserve-cta').getByRole('button', { name: 'Reservar' }).click();
  await page.waitForURL(`**/productos/${vuelo.id}/reservar`);
  check('30.6', 'Con sesión, "Reservar" lleva directo a la página de reserva', true);

  // Fechas elegidas en el calendario del detalle llegan a la reserva
  await page.goto(`${BASE}/productos/${vuelo.id}`, { waitUntil: 'networkidle' });
  const avail = page.locator('.product-availability');
  await avail.locator('.dcal').waitFor();
  const pre1 = plusDays(OFFSET + 10);
  const pre2 = plusDays(OFFSET + 12);
  await pickDay(avail, pre1);
  await pickDay(avail, pre2);
  await avail.getByRole('button', { name: 'Reservar estas fechas' }).click();
  await page.waitForURL('**/reservar?**');
  await page.getByLabel('Fecha de entrada').waitFor();
  await page.waitForFunction(() => document.querySelector('#r-in')?.value);
  check('30.7', 'Las fechas elegidas en el detalle se cargan en la reserva', (await page.getByLabel('Fecha de entrada').inputValue()) === longDate(pre1) && (await page.getByLabel('Fecha de salida').inputValue()) === longDate(pre2));

  // Busqueda por fecha (home)
  const home = await newPage(1366, 900);
  await home.goto(BASE, { waitUntil: 'networkidle' });
  await home.locator('.date-trigger').click();
  const pop = home.locator('.calendar-popover');
  await pickDay(pop, plusDays(4));
  await pickDay(pop, plusDays(6));
  await pop.getByRole('button', { name: 'Aplicar' }).click();
  await home.getByRole('button', { name: 'Realizar búsqueda' }).click();
  await home.locator('.search-results .results-count strong').first().waitFor();
  await home.waitForTimeout(600);
  const dated = await home.locator('.search-results .product-card h3').allInnerTexts();
  check('30.8', 'Buscar por fecha lista los productos disponibles en ese rango', dated.length > 0 && !dated.includes(hotel.name), `(${dated.join(', ')})`);

  // ---------------- #31 Página de reserva ----------------
  page = await newPage(1366, 900);
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await fillLogin(page, DEMO);
  await page.locator('.user-trigger').waitFor();
  await page.goto(`${BASE}/productos/${vuelo.id}/reservar`, { waitUntil: 'networkidle' });
  const summary = page.locator('.product-summary');
  await summary.waitFor();
  const summaryText = await summary.innerText();
  check('31.1', 'Detalle del producto: título, ubicación, imagen, descripción e información destacada', summaryText.includes(vuelo.name) && summaryText.includes(vuelo.location || 'Aeroparque') && (await summary.locator('img.summary-cover').count()) === 1 && (await summary.locator('.summary-description').innerText()).length > 20 && (await summary.locator('.summary-features li').count()) > 0);
  check('31.2', 'Detalles adicionales: políticas del producto', (await summary.locator('.summary-policies').count()) === 1);
  check('31.3', 'Datos del usuario: nombre, apellido y correo', (await page.getByLabel('Nombre', { exact: true }).inputValue()) === 'Lucia' && (await page.getByLabel('Apellido').inputValue()) === 'Fernandez' && (await page.locator('#r-email').inputValue()) === DEMO.email);
  check('31.4', 'Posibilidad de ampliar datos (teléfono, personas, comentarios)', (await page.getByLabel(/Teléfono de contacto/).count()) === 1 && (await page.getByLabel(/Cantidad de personas/).count()) === 1 && (await page.getByLabel(/Comentarios para el proveedor/).count()) === 1);
  check('31.5', 'Botón para confirmar la reserva', (await page.getByRole('button', { name: 'Confirmar reserva' }).count()) === 1);

  // #32 errores de formulario
  await page.getByRole('button', { name: 'Confirmar reserva' }).click();
  check('32.1', 'Sin fechas: mensaje que indica cómo solucionarlo', (await page.locator('.field-error').first().innerText()).includes('Elige la fecha de entrada'));

  const resCal = page.locator('.res-card', { hasText: 'Selecciona tus fechas' });
  const start = plusDays(OFFSET);
  const end = plusDays(OFFSET + 3);
  await pickDay(resCal, start);
  await pickDay(resCal, end);
  check('30.9', 'El rango elegido se imprime en los campos de fecha del formulario', (await page.getByLabel('Fecha de entrada').inputValue()) === longDate(start) && (await page.getByLabel('Fecha de salida').inputValue()) === longDate(end));
  check('31.6', 'Resumen con el período seleccionado y las noches', (await page.locator('.summary-dates').innerText()).includes('3'));

  await page.getByLabel(/Teléfono de contacto/).fill('abc');
  await page.getByRole('button', { name: 'Confirmar reserva' }).click();
  check('32.2', 'Teléfono inválido: error específico en el campo', (await page.locator('.field.has-error .field-error').innerText()).includes('teléfono no es válido'));
  await page.getByLabel(/Teléfono de contacto/).fill('+54 11 5555-5555');
  await page.getByLabel(/Cantidad de personas/).fill('2');
  await page.getByLabel(/Comentarios para el proveedor/).fill(`Viajamos con mochila ${STAMP}`);
  await shot(page, 'pagina-reserva', true);

  await page.getByRole('button', { name: 'Confirmar reserva' }).click();
  await page.waitForURL('**/confirmacion');
  const conf = page.locator('.confirmation-card');
  await conf.waitFor();
  const confText = await conf.innerText();
  const code = (confText.match(/RY-\d{6}/) || [''])[0];
  check('32.3', 'Página de confirmación de reserva exitosa', confText.includes('¡Reserva realizada con éxito!') && code.length > 0, `(${code})`);
  check('32.4', 'Muestra los datos no obligatorios del formulario', confText.includes('+54 11 5555-5555') && confText.includes(`Viajamos con mochila ${STAMP}`) && /Personas\s*2/.test(confText));
  check('35.1', 'Confirmación muestra el contacto del proveedor', confText.includes('Contacto del proveedor'));
  await shot(page, 'confirmacion-reserva', true);

  // Fechas ocupadas: el calendario ya no permite elegirlas
  await page.goto(`${BASE}/productos/${vuelo.id}/reservar`, { waitUntil: 'networkidle' });
  const resCal2 = page.locator('.res-card', { hasText: 'Selecciona tus fechas' });
  await resCal2.locator('.dcal').waitFor();
  await pickDay(resCal2, plusDays(OFFSET - 2));
  await pickDay(resCal2, plusDays(OFFSET + 1));
  check('30.10', 'La reserva no puede incluir fechas no disponibles', (await page.getByLabel('Fecha de salida').inputValue()) === '' && (await resCal2.locator(`.dcal-day[data-date="${iso(start)}"]`).getAttribute('class')).includes('booked'));

  // Conflicto: otra persona reserva las mismas fechas mientras el usuario completa el formulario
  const c1 = plusDays(OFFSET + 30);
  const c2 = plusDays(OFFSET + 32);
  await pickDay(resCal2, c1);
  await pickDay(resCal2, c2);
  const other = await api('POST', '/reservations', demoToken, { productId: vuelo.id, startDate: iso(c1), endDate: iso(c2) });
  await page.getByRole('button', { name: 'Confirmar reserva' }).click();
  await page.locator('.reservation-error').waitFor();
  const conflictText = await page.locator('.reservation-error').innerText();
  check('32.5', 'Error de reserva con mensaje específico y cómo solucionarlo', other.status === 201 && conflictText.includes('acaban de ser reservadas') && conflictText.includes('elige otro rango'));
  await page.waitForTimeout(500);
  check('32.6', 'Tras el error se actualiza el calendario con las fechas tomadas', (await resCal2.locator(`.dcal-day[data-date="${iso(c1)}"]`).getAttribute('class')).includes('booked'));
  await page.locator('.reservation-side').screenshot({ path: path.join(CAP, 'reserva-error.png') });

  // ---------------- #33 Historial ----------------
  await page.locator('.user-trigger').click();
  await page.getByRole('menuitem', { name: 'Mis reservas' }).click();
  await page.waitForURL('**/mis-reservas');
  await page.locator('.reservation-item').first().waitFor();
  const items = page.locator('.reservation-item');
  const mine = items.filter({ hasText: code });
  check('33.1', 'Sección "Mis reservas" accesible desde la cuenta', (await mine.count()) === 1);
  const mineText = await mine.innerText();
  check('33.2', 'Cada reserva muestra producto, fecha de reserva y fechas de uso', mineText.includes(vuelo.name) && mineText.includes('Fecha de reserva') && mineText.includes(longDate(start)));
  const starts = await page.evaluate(() => [...document.querySelectorAll('.reservation-item .reservation-dates dd')].filter((_, i, all) => i % 1 === 0).map((dd) => dd.textContent).filter((t) => t.includes('→')));
  const parsed = starts.map((t) => t.split(' → ')[0]);
  const toDate = (s) => { const [d, , m, , y] = s.split(' '); return new Date(Number(y), MONTHS.indexOf(m), Number(d)); };
  const sorted = parsed.every((s, i) => i === 0 || toDate(parsed[i - 1]) >= toDate(s));
  check('33.3', 'Lista ordenada por fecha de uso (más reciente primero)', sorted && parsed.length >= 3, `(${parsed.length} reservas)`);
  await shot(page, 'mis-reservas', true);
  await page.getByRole('tab', { name: 'Anteriores' }).click();
  const prevStatuses = await page.locator('.reservation-item .status-badge').allInnerTexts();
  check('33.4', 'Filtro "Anteriores" muestra las reservas finalizadas', prevStatuses.length > 0 && prevStatuses.every((s) => s === 'Finalizada'), `(${prevStatuses.length})`);

  const mRes = await newPage(390, 844);
  await mRes.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await fillLogin(mRes, DEMO);
  await mRes.locator('.user-trigger').waitFor();
  await mRes.goto(`${BASE}/mis-reservas`, { waitUntil: 'networkidle' });
  await mRes.locator('.reservation-item').first().waitFor();
  check('33.5', 'Historial en móvil sin desbordamiento', (await overflowX(mRes)) <= 0);
  await shot(mRes, 'movil-mis-reservas');
  await mRes.goto(`${BASE}/productos/${vuelo.id}/reservar`, { waitUntil: 'networkidle' });
  await mRes.locator('.product-summary').waitFor();
  check('31.7', 'Página de reserva en móvil sin desbordamiento', (await overflowX(mRes)) <= 0);
  await shot(mRes, 'movil-reserva', true);

  // ---------------- #34 WhatsApp ----------------
  for (const [w, h, label] of [[1366, 900, 'desktop'], [820, 1180, 'tablet'], [390, 844, 'movil']]) {
    const p = await newPage(w, h);
    await p.goto(BASE, { waitUntil: 'networkidle' });
    const box = await p.locator('.wa-fab').boundingBox();
    const position = await p.locator('.wa-widget').evaluate((el) => getComputedStyle(el).position);
    check(`34.${label === 'desktop' ? 1 : label === 'tablet' ? 2 : 3}`, `Botón de WhatsApp abajo a la derecha (${label}, fijo al hacer scroll)`, position === 'fixed' && w - (box.x + box.width) <= 24 && h - (box.y + box.height) <= 24, `(${Math.round(w - box.x - box.width)}px der., ${Math.round(h - box.y - box.height)}px abajo)`);
    if (label === 'movil') await shot(p, 'whatsapp-movil');
  }

  const wa = await newPage(1366, 900);
  await wa.goto(`${BASE}/productos/${hotel.id}`, { waitUntil: 'networkidle' });
  await wa.locator('.wa-fab').click();
  const panel = wa.locator('.wa-panel');
  await panel.waitFor();
  check('34.4', 'Sin sesión puede abrir el chat; el mensaje menciona el producto', (await wa.locator('.user-trigger').count()) === 0 && (await panel.getByLabel('Tu mensaje').inputValue()).includes(hotel.name));
  check('34.5', 'Aviso de privacidad visible', (await panel.locator('.wa-privacy').innerText()).includes('no lo guarda'));
  await panel.getByLabel('Tu mensaje').fill('');
  await panel.getByRole('button', { name: /Enviar por WhatsApp/ }).click();
  check('34.6', 'Mensaje vacío: error informativo', (await panel.locator('.wa-status.error').innerText()).includes('Escribe tu consulta'));
  await panel.getByLabel('Tu mensaje').fill(`Hola, ¿hay cochera? ${STAMP}`);
  await wa.context().setOffline(true);
  await panel.getByRole('button', { name: /Enviar por WhatsApp/ }).click();
  check('34.7', 'Sin conexión: error informativo', (await panel.locator('.wa-status.error').innerText()).includes('No hay conexión'));
  await wa.context().setOffline(false);
  const [popup] = await Promise.all([wa.context().waitForEvent('page'), panel.getByRole('button', { name: /Enviar por WhatsApp/ }).click()]);
  const waUrl = decodeURIComponent(popup.url());
  check('34.8', 'Abre WhatsApp (wa.me) con el número del proveedor y el mensaje', /wa\.me\/\d{10,15}\?text=/.test(waUrl) && waUrl.includes(`¿hay cochera? ${STAMP}`), `(${waUrl.slice(0, 60)}...)`);
  check('34.9', 'Notificación de éxito tras abrir WhatsApp', (await panel.locator('.wa-status.success').innerText()).includes('Abrimos WhatsApp'));
  await shot(wa, 'whatsapp');
  await popup.close();

  // ---------------- #35 Correo de confirmación ----------------
  const logPath = process.env.BACKEND_LOG;
  if (logPath && fs.existsSync(logPath)) {
    const log = fs.readFileSync(logPath, 'utf8');
    const block = log.slice(log.lastIndexOf(`Reserva confirmada ${code}`) - 200);
    check('35.2', 'Se genera el correo de la reserva al correo del usuario registrado', block.includes(`Correo de reserva para ${DEMO.email}`) && block.includes(code));
    check('35.3', 'El correo incluye producto, fechas, hora de la reserva y contacto del proveedor', block.includes(vuelo.name) && block.includes('Entrada:') && block.includes('Reserva realizada:') && block.includes('Contacto del proveedor'));
  } else {
    console.log('(sin BACKEND_LOG: se omite la verificación del log del correo; está cubierta por EmailServiceTest)');
  }

  await browser.close();
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} OK`);
  fs.writeFileSync(path.join(__dirname, 'resultados-sprint4.json'), JSON.stringify({ fecha: new Date().toISOString(), passed, total: results.length, results }, null, 2));
  process.exit(passed === results.length ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
