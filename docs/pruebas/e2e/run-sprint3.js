/**
 * Pruebas end-to-end del Sprint 3 (historias #22 a #29).
 * Requiere backend en :8080 (con los datos iniciales) y frontend en :5173. Uso:
 *   npm install playwright-core
 *   node run-sprint3.js
 * Usa Microsoft Edge instalado (canal msedge). Capturas en docs/pruebas/capturas/sprint3.
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5173';
const API = 'http://localhost:8080/api';
const CAP = path.join(__dirname, '..', 'capturas', 'sprint3');
const ADMIN = { email: 'admin@reservaya.com', password: 'Admin1234' };
const DEMO = { email: 'usuario@reservaya.com', password: 'Usuario1234' };
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const STAMP = Date.now().toString().slice(-6);

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

async function api(method, url, token, body) {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.status === 204 ? null : res.json();
}
const apiLogin = async ({ email, password }) => (await api('POST', '/auth/login', null, { email, password })).token;

async function uiLogin(page, { email, password }) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.locator('.user-trigger').waitFor({ timeout: 5000 });
}

/** Hace clic en un dia del calendario, avanzando de mes si hace falta. */
async function pickDay(scope, date) {
  for (let i = 0; i < 4; i += 1) {
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
    // Las redes sociales no se cargan de verdad: se responde localmente para verificar la URL
    await ctx.route(/(facebook|twitter|instagram|wa\.me)/, (route) => route.fulfill({ status: 200, body: 'ok' }));
    return ctx;
  };
  const newPage = async (w, h) => (await newContext(w, h)).newPage();

  const products = await api('GET', '/products');
  const hotel = products.find((p) => p.name === 'Hotel Mirador del Lago');
  const auto = products.find((p) => p.name === 'Auto Compacto Automatico');
  const vestido = products.find((p) => p.name === 'Vestido de Gala Alquiler');
  const adminToken = await apiLogin(ADMIN);
  const demoToken = await apiLogin(DEMO);
  for (const fav of await api('GET', '/favorites', demoToken)) await api('DELETE', `/favorites/${fav.id}`, demoToken);

  // ---------------- #22 Realizar búsqueda ----------------
  let page = await newPage(1366, 900);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const searchBlock = page.locator('.home-search');
  check('22.1', 'Bloque con título visible y párrafo descriptivo', (await searchBlock.locator('h1').innerText()).length > 10 && (await searchBlock.locator('.search-intro').innerText()).length > 20);
  check('22.2', 'Etiquetas claras y botón "Realizar búsqueda"', (await page.getByLabel('¿Qué buscas?').count()) === 1 && (await page.getByRole('button', { name: 'Realizar búsqueda' }).count()) === 1);

  await page.getByLabel('¿Qué buscas?').pressSequentially('hot', { delay: 60 });
  await page.locator('.suggestions li').first().waitFor();
  const suggestions = await page.locator('.suggestions li').allInnerTexts();
  check('22.3', 'Sugerencias de autocompletado al escribir', suggestions.some((s) => s.includes('Hoteles')) && suggestions.some((s) => s.includes('Hotel Mirador')), `(${suggestions.map((s) => s.split('\n')[0]).join(', ')})`);
  check('22.4', 'Resalta la parte coincidente', (await page.locator('.suggestions mark').first().innerText()).toLowerCase() === 'hot');
  await shot(page, 'busqueda-sugerencias');

  await page.getByLabel('¿Qué buscas?').press('ArrowDown');
  await page.getByLabel('¿Qué buscas?').press('ArrowDown');
  await page.getByLabel('¿Qué buscas?').press('Enter');
  await page.locator('.search-results .results-count strong').first().waitFor();
  check('22.5', 'Elegir una sugerencia con teclado autocompleta y busca', (await page.getByLabel('¿Qué buscas?').inputValue()) === 'Hotel Mirador del Lago' && (await page.locator('.search-results .product-card h3').first().innerText()) === 'Hotel Mirador del Lago');

  await page.getByLabel('¿Qué buscas?').fill('lago');
  await page.getByRole('button', { name: 'Realizar búsqueda' }).click();
  await page.waitForTimeout(700);
  const lagoNames = await page.locator('.search-results .product-card h3').allInnerTexts();
  check('22.6', 'Resultados relevantes: coincidencia en el nombre primero', lagoNames[0] === 'Hotel Mirador del Lago', `(${lagoNames.join(', ')})`);
  check('22.7', 'Resultados con cantidad y criterio', (await page.locator('.search-results .results-count').innerText()).includes('para “lago”'));
  check('22.8', 'Se mantienen las secciones de categorías y recomendaciones', (await page.locator('h2', { hasText: 'Buscar por categoría' }).isVisible()) && (await page.locator('h2', { hasText: 'Recomendaciones' }).count()) === 1);

  // Fechas con calendario doble: el hotel esta reservado de hoy+3 a hoy+7
  await page.getByLabel('¿Qué buscas?').fill('hotel');
  await page.locator('.date-trigger').click();
  const popover = page.locator('.calendar-popover');
  await popover.waitFor();
  check('22.9', 'Calendario doble: dos meses visibles', (await popover.locator('.dcal-month').count()) === 2);
  const pastDisabled = await popover.locator(`.dcal-day[data-date="${iso(plusDays(-1))}"]`).count() === 0
    || await popover.locator(`.dcal-day[data-date="${iso(plusDays(-1))}"]`).isDisabled();
  check('22.10', 'Días pasados deshabilitados', pastDisabled);
  await pickDay(popover, plusDays(4));
  await pickDay(popover, plusDays(6));
  check('22.11', 'Selección de rango (entrada y salida)', (await popover.locator('.calendar-footer').innerText()).includes('2 noches'));
  await shot(page, 'busqueda-calendario-doble');
  await popover.getByRole('button', { name: 'Aplicar' }).click();
  await page.getByRole('button', { name: 'Realizar búsqueda' }).click();
  await page.waitForTimeout(800);
  const datedNames = await page.locator('.search-results .product-card h3').allInnerTexts();
  const datedText = await page.locator('.search-results .results-count').innerText();
  check('22.12', 'Con fechas excluye productos ocupados (el hotel reservado no aparece)', !datedNames.includes('Hotel Mirador del Lago') && datedText.includes('disponibles del'), `(${datedNames.join(', ') || 'sin resultados'})`);
  await shot(page, 'busqueda-resultados', true);

  await page.getByLabel('¿Qué buscas?').fill('zzzzzz');
  await page.locator('.date-trigger').click();
  await page.getByRole('button', { name: 'Borrar fechas' }).click();
  await page.getByRole('button', { name: 'Realizar búsqueda' }).click();
  await page.locator('text=No encontramos productos').waitFor();
  check('22.13', 'Sin resultados muestra un mensaje claro', true);
  await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
  check('22.14', '"Limpiar búsqueda" oculta los resultados', (await page.locator('.search-results').count()) === 0);

  const mobile = await newPage(390, 844);
  await mobile.goto(BASE, { waitUntil: 'networkidle' });
  await mobile.locator('.date-trigger').click();
  const mCols = await mobile.locator('.dcal-months').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  check('22.15', 'Móvil: buscador y calendario apilado, sin desbordamiento', (await overflowX(mobile)) <= 0 && mCols === 1);
  await shot(mobile, 'movil-busqueda', true);

  // ---------------- #23 Disponibilidad ----------------
  page = await newPage(1366, 900);
  await page.goto(`${BASE}/productos/${hotel.id}`, { waitUntil: 'networkidle' });
  const avail = page.locator('.product-availability');
  await avail.locator('.dcal').waitFor();
  check('23.1', 'Calendario doble en el detalle del producto', (await avail.locator('.dcal-month').count()) === 2);
  const bookedDay = avail.locator(`.dcal-day[data-date="${iso(plusDays(4))}"]`);
  check('23.2', 'Fechas reservadas destacadas (color distinto y tachadas)', (await bookedDay.getAttribute('class')).includes('booked') && (await avail.locator('.dcal-day.available').count()) > 10);
  check('23.3', 'Leyenda Disponible / Ocupado', (await avail.locator('.calendar-legend').innerText()).includes('Ocupado'));
  await pickDay(avail, plusDays(1));
  await pickDay(avail, plusDays(5));
  check('23.4', 'No permite un rango que incluya noches ocupadas', !(await avail.locator('.availability-hint').innerText()).includes('noches disponibles'));
  await pickDay(avail, plusDays(1));
  await pickDay(avail, plusDays(3));
  check('23.5', 'Rango libre muestra las noches disponibles', (await avail.locator('.availability-hint').innerText()).includes('2 noches disponibles'));
  await avail.scrollIntoViewIfNeeded();
  await avail.screenshot({ path: path.join(CAP, 'disponibilidad.png') });

  const errPage = await newPage(1366, 900);
  await errPage.route('**/availability**', (route) => route.abort());
  await errPage.goto(`${BASE}/productos/${hotel.id}`, { waitUntil: 'networkidle' });
  const errBox = errPage.locator('.availability-error');
  await errBox.waitFor();
  check('23.6', 'Error al obtener disponibilidad: mensaje claro', (await errBox.innerText()).includes('No pudimos obtener la disponibilidad'));
  await errBox.screenshot({ path: path.join(CAP, 'disponibilidad-error.png') });
  await errPage.unroute('**/availability**');
  await errPage.getByRole('button', { name: 'Reintentar' }).click();
  await errPage.locator('.product-availability .dcal').waitFor();
  check('23.7', 'Opción "Reintentar" vuelve a cargar el calendario', true);

  // ---------------- #26 Políticas ----------------
  const policies = page.locator('.product-policies');
  const widths = await page.evaluate(() => [document.querySelector('.product-policies').offsetWidth, document.querySelector('.product-detail').offsetWidth]);
  check('26.1', 'Bloque de políticas al 100% del contenedor', widths[0] === widths[1], `(${widths.join(' / ')} px)`);
  const decoration = await policies.locator('h2').evaluate((el) => getComputedStyle(el).textDecorationLine);
  check('26.2', 'Título identificable y subrayado', decoration.includes('underline') && (await policies.locator('h2').innerText()).length > 3);
  const polCols = await policies.locator('.policies-grid').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  check('26.3', 'Políticas distribuidas en columnas', polCols === 3, `(${polCols} col.)`);
  check('26.4', 'Cada política con título y descripción', (await policies.locator('.policy h3').count()) === 3 && (await policies.locator('.policy p').count()) === 3);
  await policies.scrollIntoViewIfNeeded();
  await policies.screenshot({ path: path.join(CAP, 'politicas.png') });

  // ---------------- #28 Puntuar producto (lectura) ----------------
  const headerRating = await page.locator('.detail-header .rating-summary').innerText();
  check('28.1', 'Puntuación media y cantidad visibles en el detalle', /\d\.\d/.test(headerRating) && headerRating.includes('valoraci'), `(${headerRating.replace(/\s+/g, ' ')})`);
  const firstReview = page.locator('.review').first();
  await firstReview.waitFor();
  check('28.2', 'Reseña con estrellas, nombre, fecha y comentario', (await firstReview.locator('.stars').count()) === 1 && (await firstReview.locator('.review-name').innerText()).length > 2 && (await firstReview.locator('time').innerText()).length > 4 && (await firstReview.locator('.review-comment').count()) === 1);
  check('28.3', 'Anónimo: invitación a iniciar sesión para valorar', (await page.locator('.product-reviews .info-text').innerText()).includes('Inicia sesión'));
  await page.locator('.product-reviews').screenshot({ path: path.join(CAP, 'valoraciones.png') });

  // ---------------- #27 Compartir ----------------
  await page.getByRole('button', { name: 'Compartir producto' }).click();
  const dialog = page.getByRole('dialog', { name: 'Compartir producto' });
  await dialog.waitFor();
  check('27.1', 'Botón compartir abre una ventana emergente', true);
  check('27.2', 'Muestra imagen, descripción breve y enlace directo', (await dialog.locator('.share-preview img').count()) === 1 && (await dialog.locator('.share-preview p').innerText()).length > 10 && (await dialog.getByLabel('Enlace al producto').inputValue()).endsWith(`/productos/${hotel.id}`));
  const networks = await dialog.locator('.network-option').allInnerTexts();
  check('27.3', 'Opciones Facebook, X (Twitter) e Instagram', ['Facebook', 'X (Twitter)', 'Instagram'].every((n) => networks.some((t) => t.includes(n))), `(${networks.join(', ')})`);
  await dialog.locator('.network-option', { hasText: 'X (Twitter)' }).click();
  await dialog.getByLabel('Mensaje personalizado').fill(`Mi recomendación ${STAMP}`);
  await shot(page, 'compartir');
  const [popup] = await Promise.all([page.context().waitForEvent('page'), dialog.getByRole('button', { name: /Compartir en X/ }).click()]);
  const popupUrl = decodeURIComponent(popup.url());
  check('27.4', 'Elige red y mensaje personalizado: abre X con el texto y el enlace', popupUrl.includes('twitter.com/intent/tweet') && popupUrl.includes(`Mi recomendación ${STAMP}`) && popupUrl.includes(`/productos/${hotel.id}`), `(${popupUrl.slice(0, 80)}...)`);
  await popup.close();
  await dialog.locator('.network-option', { hasText: 'Facebook' }).click();
  const [fbPopup] = await Promise.all([page.context().waitForEvent('page'), dialog.getByRole('button', { name: /Compartir en Facebook/ }).click()]);
  check('27.5', 'Facebook abre su página de compartir con el enlace', decodeURIComponent(fbPopup.url()).includes(`facebook.com/sharer/sharer.php?u=${BASE}/productos/${hotel.id}`));
  await fbPopup.close();
  await page.keyboard.press('Escape');
  check('27.6', 'La ventana se cierra con Escape', (await page.getByRole('dialog').count()) === 0);

  // ---------------- #24 / #25 Favoritos ----------------
  page = await newPage(1366, 900);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const cardsWithHeart = await page.locator('.product-card .fav-btn').count();
  check('24.1', 'Botón de favorito en cada producto del home', cardsWithHeart > 0 && cardsWithHeart === (await page.locator('.product-card').count()), `(${cardsWithHeart})`);
  await page.locator('.product-card .fav-btn').first().click();
  await page.waitForURL('**/login');
  check('24.2', 'Anónimo: el corazón lleva al login', (await page.locator('.info-text').innerText()).includes('favoritos'));

  await uiLogin(page, DEMO);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const autoCard = page.locator('.results-section .product-card', { hasText: auto.name });
  await autoCard.locator('.fav-btn').click();
  await page.waitForTimeout(400);
  check('24.3', 'Usuario autenticado marca favorito con un clic', (await autoCard.locator('.fav-btn').getAttribute('aria-pressed')) === 'true');
  const sameInRecs = page.locator('.product-card .fav-btn[aria-label*="' + auto.name + '"]');
  check('24.4', 'El estado se refleja en todas las tarjetas del mismo producto', (await sameInRecs.evaluateAll((els) => els.every((e) => e.getAttribute('aria-pressed') === 'true'))));
  const hotelCard = page.locator('.results-section .product-card', { hasText: hotel.name });
  await hotelCard.locator('.fav-btn').click();
  await hotelCard.locator('.fav-btn').click();
  await hotelCard.locator('.fav-btn').click();
  await page.waitForTimeout(500);
  await autoCard.scrollIntoViewIfNeeded();
  await shot(page, 'favorito-marcado');
  const apiFavs = (await api('GET', '/favorites', demoToken)).map((p) => p.name);
  check('24.5', 'Marcar y desmarcar se guarda en el servidor', apiFavs.includes(auto.name) && apiFavs.includes(hotel.name), `(${apiFavs.join(', ')})`);

  await page.locator('.user-trigger').click();
  await page.getByRole('menuitem', { name: 'Mis favoritos' }).click();
  await page.waitForURL('**/favoritos');
  await page.locator('.favorite-item').first().waitFor();
  const favNames = await page.locator('.favorite-name').allInnerTexts();
  check('25.1', 'Lista de favoritos accesible desde la cuenta ("Mis favoritos")', favNames.includes(auto.name) && favNames.includes(hotel.name), `(${favNames.join(', ')})`);
  await shot(page, 'mis-favoritos');

  await page.getByRole('link', { name: auto.name }).first().click();
  await page.waitForURL(`**/productos/${auto.id}`);
  await page.locator('.detail-actions .fav-btn').click();
  await page.waitForTimeout(300);
  await page.goBack();
  await page.waitForURL('**/favoritos');
  const afterUnmark = await page.locator('.favorite-name').allInnerTexts();
  check('25.2', 'Se actualiza en tiempo real al desmarcar en otra sección', !afterUnmark.includes(auto.name) && afterUnmark.includes(hotel.name));
  await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/api/favorites/${hotel.id}`) && r.request().method() === 'DELETE'),
    page.getByRole('button', { name: `Quitar ${hotel.name} de favoritos` }).click(),
  ]);
  await page.locator('text=Todavía no guardaste productos').waitFor();
  check('25.3', 'Eliminar desde "Mis favoritos"', (await api('GET', '/favorites', demoToken)).length === 0);

  const mFav = await newPage(390, 844);
  await uiLogin(mFav, DEMO);
  await mFav.goto(BASE, { waitUntil: 'networkidle' });
  await mFav.locator('.results-section .product-card', { hasText: vestido.name }).locator('.fav-btn').click();
  await mFav.waitForTimeout(400);
  check('24.6', 'Móvil: marcar favorito funciona', (await mFav.locator('.results-section .product-card', { hasText: vestido.name }).locator('.fav-btn').getAttribute('aria-pressed')) === 'true');
  await mFav.goto(`${BASE}/favoritos`, { waitUntil: 'networkidle' });
  await mFav.locator('.favorite-item').first().waitFor();
  check('25.4', 'Móvil: lista de favoritos sin desbordamiento', (await overflowX(mFav)) <= 0 && (await mFav.locator('.favorite-item').count()) === 1);
  await shot(mFav, 'movil-favoritos');
  await api('DELETE', `/favorites/${vestido.id}`, demoToken);

  // ---------------- #28 Puntuar producto (escritura) ----------------
  await page.goto(`${BASE}/productos/${vestido.id}`, { waitUntil: 'networkidle' });
  await page.locator('.product-reviews .info-text').waitFor();
  check('28.4', 'Sin reserva finalizada no puede valorar', (await page.locator('.product-reviews .info-text').innerText()).includes('reserva finalizada') && (await page.locator('.review-form').count()) === 0);

  await page.goto(`${BASE}/productos/${auto.id}`, { waitUntil: 'networkidle' });
  const form = page.locator('.review-form');
  await form.waitFor();
  check('28.5', 'Con reserva finalizada ve el formulario de estrellas', (await form.locator('.star-input input').count()) === 5);
  await form.getByLabel('4 estrellas').check({ force: true });
  await form.getByLabel('Comentario (opcional)').fill(`Auto cómodo y económico ${STAMP}`);
  await shot(page, 'valorar-formulario');
  await form.getByRole('button', { name: 'Publicar valoración' }).click();
  await page.locator('text=Tu valoración fue publicada').waitFor();
  const myReview = page.locator('.review', { hasText: `Auto cómodo y económico ${STAMP}` });
  check('28.6', 'La reseña publicada muestra estrellas, nombre, fecha y comentario', (await myReview.count()) === 1 && (await myReview.locator('.review-name').innerText()) === 'Lucia Fernandez');
  const summary = await api('GET', `/products/${auto.id}/reviews`);
  const header = await page.locator('.detail-header .rating-summary').innerText();
  check('28.7', 'La media se actualiza al instante en el detalle', header.includes(summary.average.toFixed(1)) && header.includes(`${summary.count} valoraci`), `(${header.replace(/\s+/g, ' ')})`);
  await page.locator('.product-reviews').screenshot({ path: path.join(CAP, 'valoracion-publicada.png') });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByLabel('¿Qué buscas?').fill('auto');
  await page.getByRole('button', { name: 'Realizar búsqueda' }).click();
  await page.locator('.search-results .product-card').first().waitFor();
  const resultRating = await page.locator('.search-results .product-card', { hasText: auto.name }).locator('.rating-summary').innerText();
  check('28.8', 'Media y cantidad visibles en los resultados de búsqueda', resultRating.includes(summary.average.toFixed(1)) && resultRating.includes(`${summary.count}`), `(${resultRating.replace(/\s+/g, ' ')})`);

  // ---------------- #29 Eliminar categoría ----------------
  const catTitle = `Temporal ${STAMP}`;
  const cat = await api('POST', '/categories', adminToken, { title: catTitle, description: 'Categoría de prueba', image: `data:image/png;base64,${PNG}` });
  const tmpProduct = await api('POST', '/products', adminToken, { name: `Producto temporal ${STAMP}`, description: 'Prueba de borrado', images: [`data:image/png;base64,${PNG}`], categoryId: cat.id });
  const admin = await newPage(1366, 900);
  await uiLogin(admin, ADMIN);
  await admin.goto(`${BASE}/administracion/categorias`, { waitUntil: 'networkidle' });
  const row = admin.locator('tr', { hasText: catTitle });
  await row.waitFor();
  check('29.1', 'Opción "Eliminar categoría" clara en el panel', (await row.getByRole('button', { name: 'Eliminar categoría' }).count()) === 1);
  await row.getByRole('button', { name: 'Eliminar categoría' }).click();
  const confirm = admin.getByRole('alertdialog');
  await confirm.waitFor();
  const confirmText = await confirm.innerText();
  check('29.2', 'Confirmación indica la categoría y las consecuencias', confirmText.includes(catTitle) && confirmText.includes('1 producto asociado quedará sin categoría'));
  check('29.3', 'Botones "Confirmar" y "Cancelar"', (await confirm.getByRole('button', { name: 'Confirmar' }).count()) === 1 && (await confirm.getByRole('button', { name: 'Cancelar' }).count()) === 1);
  await shot(admin, 'eliminar-categoria-confirmacion');
  await confirm.getByRole('button', { name: 'Cancelar' }).click();
  check('29.4', '"Cancelar" no elimina', (await admin.locator('tr', { hasText: catTitle }).count()) === 1 && (await api('GET', '/categories')).some((c) => c.id === cat.id));
  await row.getByRole('button', { name: 'Eliminar categoría' }).click();
  await admin.getByRole('alertdialog').getByRole('button', { name: 'Confirmar' }).click();
  await admin.locator('.success-text').waitFor();
  const stillThere = (await api('GET', '/categories')).some((c) => c.id === cat.id);
  const orphan = await api('GET', `/products/${tmpProduct.id}`);
  check('29.5', '"Confirmar" elimina la categoría (los productos quedan sin categoría)', !stillThere && (await admin.locator('tr', { hasText: catTitle }).count()) === 0 && orphan.category === null);
  await api('DELETE', `/products/${tmpProduct.id}`, adminToken);

  await browser.close();
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} OK`);
  fs.writeFileSync(path.join(__dirname, 'resultados-sprint3.json'), JSON.stringify({ fecha: new Date().toISOString(), passed, total: results.length, results }, null, 2));
  process.exit(passed === results.length ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
