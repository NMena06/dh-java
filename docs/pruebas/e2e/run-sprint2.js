/**
 * Pruebas end-to-end del Sprint 2 (historias #12 a #21).
 * Requiere backend en :8080 y frontend en :5173. Uso:
 *   npm install playwright-core
 *   node run-sprint2.js
 * Usa Microsoft Edge instalado (canal msedge). Capturas en docs/pruebas/capturas/sprint2.
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5173';
const API = 'http://localhost:8080/api';
const CAP = path.join(__dirname, '..', 'capturas', 'sprint2');
const ADMIN = { email: 'admin@reservaya.com', password: 'Admin1234' };
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const STAMP = Date.now().toString().slice(-6);

fs.mkdirSync(CAP, { recursive: true });
const results = [];
const check = (id, desc, ok, detail = '') => {
  results.push({ id, desc, ok: !!ok, detail });
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${id} ${desc} ${detail}`);
};
const shot = (page, name, fullPage = false) => page.screenshot({ path: path.join(CAP, `${name}.png`), fullPage });
const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

async function apiLogin(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  });
  return (await res.json()).token;
}

async function uiLogin(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.locator('.user-trigger').waitFor({ timeout: 5000 });
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const newPage = async (width, height) => (await browser.newContext({ viewport: { width, height } })).newPage();
  const userEmail = `ana.perez${STAMP}@mail.com`;
  const userPassword = 'Clave1234';

  // ---------------- #13 Registrar usuario ----------------
  let page = await newPage(1366, 900);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Crear cuenta' }).click();
  await page.waitForURL('**/registro');
  check('13.1', 'Botón "Crear cuenta" abre el formulario de registro', page.url().endsWith('/registro'));

  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  const emptyErrors = await page.locator('.field-error').count();
  check('13.2', 'Enviar vacío muestra error en los 4 campos obligatorios', emptyErrors >= 4, `(${emptyErrors} errores)`);

  await page.getByLabel('Nombre', { exact: true }).fill('A');
  await page.getByLabel('Apellido').fill('P3rez');
  await page.getByLabel('Correo electrónico').fill('ana@correo');
  await page.getByLabel('Contraseña', { exact: true }).fill('abc');
  await page.getByLabel('Repetir contraseña').fill('abd');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  const errorTexts = (await page.locator('.field-error').allInnerTexts()).join(' | ');
  check('13.3', 'Nombre corto, apellido con números, correo y contraseña inválidos', errorTexts.includes('entre 2 y 50') && errorTexts.includes('solo puede contener letras') && errorTexts.includes('no es válido') && errorTexts.includes('8 y 64'), `(${errorTexts})`);
  check('13.4', 'Contraseñas distintas', errorTexts.includes('no coinciden'));
  await shot(page, 'registro-validaciones');

  await page.getByLabel('Nombre', { exact: true }).fill('ana maría');
  await page.getByLabel('Apellido').fill('pérez');
  await page.getByLabel('Correo electrónico').fill(userEmail);
  await page.getByLabel('Contraseña', { exact: true }).fill(userPassword);
  await page.getByLabel('Repetir contraseña').fill(userPassword);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.locator('.success-card').waitFor();
  const successText = await page.locator('.success-card').innerText();
  check('13.5', 'Registro válido muestra confirmación con nombre y correo', successText.includes('Registro exitoso') && successText.includes('Ana María') && successText.includes(userEmail));
  await shot(page, 'registro-exitoso');

  // #19 reenviar correo
  await page.getByRole('button', { name: 'Reenviar correo de confirmación' }).click();
  await page.locator('text=Te reenviamos el correo').waitFor();
  check('19.1', 'Opción "Reenviar correo de confirmación" funciona', true);

  // Correo duplicado
  page = await newPage(1366, 900);
  await page.goto(`${BASE}/registro`, { waitUntil: 'networkidle' });
  await page.getByLabel('Nombre', { exact: true }).fill('Otra');
  await page.getByLabel('Apellido').fill('Persona');
  await page.getByLabel('Correo electrónico').fill(userEmail.toUpperCase());
  await page.getByLabel('Contraseña', { exact: true }).fill(userPassword);
  await page.getByLabel('Repetir contraseña').fill(userPassword);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.locator('.field-error').first().waitFor();
  check('13.6', 'Correo ya registrado (sin distinguir mayúsculas) muestra error', (await page.locator('.field-error').innerText()).includes('Ya existe una cuenta'));

  // ---------------- #14 Identificar usuario ----------------
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Correo electrónico').fill(userEmail);
  await page.getByLabel('Contraseña').fill('Incorrecta1');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.locator('.login-error').waitFor();
  const loginError = await page.locator('.login-error').innerText();
  check('14.1', 'Credenciales incorrectas muestran mensaje claro', loginError.includes('Correo electrónico o contraseña incorrectos'), `(${loginError})`);
  await shot(page, 'login-error');

  await page.getByLabel('Contraseña').fill(userPassword);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.locator('.user-trigger').waitFor();
  const avatar = (await page.locator('.user-trigger .avatar').innerText()).trim();
  const shownName = (await page.locator('.user-trigger .user-name').innerText()).trim();
  check('14.2', 'Login válido muestra avatar con iniciales', avatar === 'AP', `(${avatar})`);
  check('14.3', 'Login válido muestra el nombre del usuario', shownName === 'Ana María Pérez', `(${shownName})`);
  check('14.4', 'Ya no se muestran "Crear cuenta" / "Iniciar sesión"', (await page.locator('header').getByRole('link', { name: 'Crear cuenta' }).count()) === 0);
  await shot(page, 'header-usuario');

  await page.goto(`${BASE}/mi-cuenta`, { waitUntil: 'networkidle' });
  const profileText = await page.locator('.profile-card').innerText();
  check('14.5', 'Accede a su información personal (Mi cuenta)', profileText.includes(userEmail) && profileText.includes('Pérez'));
  await page.reload({ waitUntil: 'networkidle' });
  check('14.6', 'La sesión se mantiene al recargar la página', (await page.locator('.user-trigger').count()) === 1);

  // #16 un usuario común no accede a la administración
  await page.goto(`${BASE}/administracion`, { waitUntil: 'networkidle' });
  check('16.1', 'Usuario común ve "Acceso denegado" en /administracion', (await page.locator('text=Acceso denegado').count()) === 1);
  await shot(page, 'acceso-denegado');

  // ---------------- #15 Cerrar sesión ----------------
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('.user-trigger').click();
  const avatarBox = await page.locator('.user-trigger .avatar').boundingBox();
  const logoutBox = await page.getByRole('menuitem', { name: 'Cerrar sesión' }).boundingBox();
  check('15.1', 'Opción "Cerrar sesión" debajo del avatar', logoutBox && avatarBox && logoutBox.y > avatarBox.y + avatarBox.height);
  await shot(page, 'menu-cerrar-sesion');
  const tokenBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('reservaya.session') || 'null')?.token);
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await page.getByRole('link', { name: 'Iniciar sesión' }).waitFor();
  check('15.2', 'Tras cerrar sesión vuelve a ver "Crear cuenta" e "Iniciar sesión"', (await page.locator('header').getByRole('link', { name: 'Crear cuenta' }).count()) === 1);
  const meAfter = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${tokenBefore}` } });
  check('15.3', 'El token anterior queda invalidado en el servidor', meAfter.status === 401, `(HTTP ${meAfter.status})`);
  await page.goto(`${BASE}/mi-cuenta`, { waitUntil: 'networkidle' });
  check('15.4', 'Sin sesión, "Mi cuenta" redirige al login', page.url().endsWith('/login'));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  check('15.5', 'Sigue navegando como anónimo (home con productos)', (await page.locator('.product-card').count()) > 0);

  // ---------------- #16 Otorgar / quitar administrador ----------------
  const admin = await newPage(1366, 900);
  await uiLogin(admin, ADMIN.email, ADMIN.password);
  await admin.goto(`${BASE}/administracion`, { waitUntil: 'networkidle' });
  const tiles = await admin.locator('.admin-tile strong').allInnerTexts();
  check('16.2', 'Admin ve el panel con categorías, características y usuarios', ['Agregar categoría', 'Administrar características', 'Usuarios'].every((t) => tiles.includes(t)), `(${tiles.join(', ')})`);
  await shot(admin, 'admin-panel');
  await admin.getByRole('link', { name: /Usuarios/ }).click();
  await admin.waitForURL('**/administracion/usuarios');
  const row = admin.locator('tr', { hasText: userEmail });
  await row.getByRole('button', { name: 'Hacer administrador' }).waitFor();
  admin.once('dialog', (d) => d.accept());
  await row.getByRole('button', { name: 'Hacer administrador' }).click();
  await row.getByRole('button', { name: 'Quitar administrador' }).waitFor();
  check('16.3', 'Listado de usuarios permite otorgar el permiso', (await row.innerText()).includes('Administrador'));
  check('16.4', 'El admin no puede quitarse sus propios permisos', await admin.locator('tr', { hasText: ADMIN.email }).getByRole('button').isDisabled());
  await shot(admin, 'admin-usuarios');

  page = await newPage(1366, 900);
  await uiLogin(page, userEmail, userPassword);
  await page.goto(`${BASE}/administracion`, { waitUntil: 'networkidle' });
  check('16.5', 'El nuevo admin accede al panel', (await page.locator('h1', { hasText: 'Panel de administración' }).count()) === 1);

  admin.once('dialog', (d) => d.accept());
  await row.getByRole('button', { name: 'Quitar administrador' }).click();
  await row.getByRole('button', { name: 'Hacer administrador' }).waitFor();
  const userToken = await page.evaluate(() => JSON.parse(localStorage.getItem('reservaya.session')).token);
  const usersRes = await fetch(`${API}/users`, { headers: { Authorization: `Bearer ${userToken}` } });
  check('16.6', 'Al quitar el permiso, la API lo rechaza de inmediato (mismo token)', usersRes.status === 403, `(HTTP ${usersRes.status})`);

  // ---------------- #21 Agregar categoría ----------------
  const categoryTitle = `Cabañas ${STAMP}`;
  await admin.goto(`${BASE}/administracion`, { waitUntil: 'networkidle' });
  await admin.getByRole('link', { name: /Agregar categoría/ }).click();
  await admin.waitForURL('**/categorias/nueva');
  await admin.getByLabel('Título').fill(categoryTitle);
  await admin.getByLabel('Descripción').fill('Escapadas a la montaña');
  await admin.locator('input[type=file]').setInputFiles({ name: 'cabana.png', mimeType: 'image/png', buffer: PNG });
  await admin.locator('.category-preview').waitFor();
  await shot(admin, 'agregar-categoria');
  await admin.getByRole('button', { name: 'Guardar categoría' }).click();
  await admin.waitForURL('**/administracion/categorias');
  await admin.locator('tr', { hasText: categoryTitle }).waitFor({ timeout: 5000 }).catch(() => {});
  check('21.1', 'Categoría con título, descripción e imagen aparece en la lista', (await admin.locator('tr', { hasText: categoryTitle }).count()) === 1);
  await shot(admin, 'lista-categorias');

  // ---------------- #17 Administrar características ----------------
  const featureName = `Chimenea ${STAMP}`;
  await admin.goto(`${BASE}/administracion`, { waitUntil: 'networkidle' });
  await admin.getByRole('link', { name: /Administrar características/ }).click();
  await admin.waitForURL('**/caracteristicas');
  await admin.locator('.admin-table tbody tr').first().waitFor();
  const featureRows = await admin.locator('.admin-table tbody tr').count();
  check('17.1', 'Lista de características con Editar y Eliminar', featureRows > 0 && (await admin.getByRole('button', { name: 'Editar' }).count()) === featureRows);
  await admin.getByRole('button', { name: 'Añadir nueva' }).click();
  await admin.getByLabel('Nombre').fill(featureName);
  await admin.locator('.icon-option', { hasText: 'Calefacción' }).click();
  await shot(admin, 'nueva-caracteristica');
  await admin.getByRole('button', { name: 'Guardar' }).click();
  await admin.locator('tr', { hasText: featureName }).waitFor();
  check('17.2', '"Añadir nueva" registra nombre e ícono', (await admin.locator('tr', { hasText: featureName }).locator('svg').count()) === 1);
  await admin.locator('tr', { hasText: featureName }).getByRole('button', { name: 'Editar' }).click();
  await admin.getByLabel('Nombre').fill(`${featureName} a leña`);
  await admin.getByRole('button', { name: 'Guardar' }).click();
  await admin.locator('tr', { hasText: `${featureName} a leña` }).waitFor();
  check('17.3', 'Editar característica', true);
  await shot(admin, 'lista-caracteristicas');

  // ---------------- #12 / #17 Producto con categoría y características ----------------
  const productName = `Cabaña del Bosque ${STAMP}`;
  await admin.goto(`${BASE}/administracion/productos/nuevo`, { waitUntil: 'networkidle' });
  await admin.getByLabel('Nombre').fill(productName);
  await admin.getByLabel('Descripción').fill('Cabaña con vista al bosque, ideal para desconectarse.');
  await admin.getByLabel('Categoría').selectOption({ label: categoryTitle });
  for (const name of ['Wifi', 'Cocina', 'Pileta', 'Aire acondicionado', 'Estacionamiento gratuito', `${featureName} a leña`]) {
    await admin.locator('.feature-option', { hasText: name }).first().click();
  }
  await admin.locator('input[type=file]').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG });
  await shot(admin, 'registrar-producto-categoria', true);
  await admin.getByRole('button', { name: 'Guardar producto' }).click();
  await admin.waitForURL('**/administracion/productos');
  const productRow = admin.locator('tr', { hasText: productName });
  const selectedCat = await productRow.locator('select option:checked').innerText();
  check('12.1', 'Registrar producto con categoría', selectedCat === categoryTitle, `(${selectedCat})`);

  await productRow.locator('select').selectOption({ label: 'Hoteles' });
  await admin.locator('.success-text').waitFor();
  const productsApi = await (await fetch(`${API}/products`)).json();
  const saved = productsApi.find((p) => p.name === productName);
  check('12.2', 'Asignar categoría a producto existente desde la lista', saved?.category?.title === 'Hoteles');
  check('17.4', 'Producto asociado a varias características', saved?.features?.length === 6, `(${saved?.features?.length})`);
  await shot(admin, 'lista-productos-categoria');

  await productRow.getByRole('link', { name: 'Editar' }).click();
  await admin.waitForURL('**/editar');
  check('12.3', 'Editar producto precarga categoría y características', (await admin.getByLabel('Categoría').locator('option:checked').innerText()) === 'Hoteles' && (await admin.locator('.feature-option.selected').count()) === 6);
  await admin.getByLabel('Categoría').selectOption({ label: categoryTitle });
  await admin.getByRole('button', { name: 'Guardar cambios' }).click();
  await admin.waitForURL('**/administracion/productos');
  check('12.4', 'Editar producto cambia la categoría', (await admin.locator('tr', { hasText: productName }).locator('select option:checked').innerText()) === categoryTitle);

  // ---------------- #18 Características en el detalle ----------------
  for (const [w, h, label, cols] of [[1366, 900, 'desktop', 4], [820, 1000, 'tablet', 2], [390, 844, 'movil', 1]]) {
    const p = await newPage(w, h);
    await p.goto(`${BASE}/productos/${saved.id}`, { waitUntil: 'networkidle' });
    await p.locator('.product-features').scrollIntoViewIfNeeded();
    const title = await p.locator('.product-features h2').innerText();
    const items = await p.locator('.feature-item').count();
    const icons = await p.locator('.feature-item svg').count();
    const gridCols = await p.locator('.features-grid').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    if (label === 'desktop') {
      check('18.1', 'Bloque con título "Características"', title === 'Características');
      check('18.2', 'Lista todas las características del producto', items === 6, `(${items})`);
      check('18.3', 'Cada característica tiene ícono', icons === items);
    }
    check(`18.${label === 'desktop' ? 4 : label === 'tablet' ? 5 : 6}`, `Responsivo ${label}: ${cols} columna(s), sin desbordamiento`, gridCols === cols && (await overflowX(p)) <= 0, `(${gridCols} col.)`);
    await p.locator('.product-features').screenshot({ path: path.join(CAP, `caracteristicas-${label}.png`) });
  }

  // Eliminar característica la quita del producto
  await admin.goto(`${BASE}/administracion/caracteristicas`, { waitUntil: 'networkidle' });
  admin.once('dialog', (d) => d.accept());
  await admin.locator('tr', { hasText: `${featureName} a leña` }).getByRole('button', { name: 'Eliminar' }).click();
  await admin.waitForTimeout(500);
  const afterDelete = await (await fetch(`${API}/products/${saved.id}`)).json();
  check('17.5', 'Eliminar característica la quita de la lista y del producto', (await admin.locator('tr', { hasText: `${featureName} a leña` }).count()) === 0 && afterDelete.features.length === 5);

  // ---------------- #20 Filtrar por categoría ----------------
  page = await newPage(1366, 900);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const catCards = await page.locator('.category-card').count();
  check('20.1', 'Categorías del backend en el home y en la barra de filtro', catCards >= 5 && (await page.locator('.filter-chips .chip').count()) === catCards, `(${catCards})`);
  const totalText = await page.locator('.results-count').innerText();
  const total = Number(totalText.match(/\d+/)[0]);
  await page.locator('.chip', { hasText: categoryTitle }).click();
  await page.waitForTimeout(600);
  const filteredText = await page.locator('.results-count').innerText();
  const names = await page.locator('.results-section .product-card h3').allInnerTexts();
  check('20.2', 'Filtrar por una categoría muestra solo sus productos', names.length === 1 && names[0] === productName, `(${names.join(', ')})`);
  check('20.3', 'Muestra cantidad filtrada y total', filteredText.includes(`Mostrando 1 de ${total} productos`), `(${filteredText})`);
  await page.locator('.chip', { hasText: 'Hoteles' }).click();
  await page.waitForTimeout(600);
  const twoCats = await page.locator('.results-count').innerText();
  const twoCount = Number(twoCats.match(/Mostrando (\d+)/)[1]);
  check('20.4', 'Seleccionar varias categorías suma resultados', twoCount > 1, `(${twoCats})`);
  await shot(page, 'filtro-categorias');
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await page.waitForTimeout(600);
  check('20.5', 'Limpiar filtros vuelve a la lista original', (await page.locator('.results-count').innerText()).includes(`${total} productos en total`) && (await page.locator('.chip.active').count()) === 0);
  await page.locator('.category-card', { hasText: 'Autos' }).click();
  await page.waitForTimeout(600);
  check('20.6', 'Clic en una tarjeta de categoría aplica el filtro', (await page.locator('.chip.active').innerText()).includes('Autos'));

  const mobile = await newPage(390, 844);
  await mobile.goto(BASE, { waitUntil: 'networkidle' });
  await mobile.locator('.chip', { hasText: 'Hoteles' }).click();
  await mobile.waitForTimeout(600);
  await mobile.locator('.results-section').scrollIntoViewIfNeeded();
  check('20.7', 'Filtro en móvil (390px) sin desbordamiento', (await overflowX(mobile)) <= 0 && (await mobile.locator('.results-count').innerText()).includes('Mostrando'));
  await mobile.locator('.results-section').screenshot({ path: path.join(CAP, 'filtro-movil.png') });

  // Header con usuario en móvil
  const mobileUser = await newPage(390, 844);
  await uiLogin(mobileUser, userEmail, userPassword);
  check('14.7', 'Header con avatar en móvil sin desbordamiento', (await overflowX(mobileUser)) <= 0);
  await mobileUser.locator('.user-trigger').click();
  await shot(mobileUser, 'movil-menu-usuario');

  // Limpieza de datos de prueba
  const adminToken = await apiLogin(ADMIN.email, ADMIN.password);
  await fetch(`${API}/products/${saved.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
  const cats = await (await fetch(`${API}/categories`)).json();
  const testCat = cats.find((c) => c.title === categoryTitle);
  if (testCat) await fetch(`${API}/categories/${testCat.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });

  await browser.close();
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} OK`);
  fs.writeFileSync(path.join(__dirname, 'resultados-sprint2.json'), JSON.stringify({ fecha: new Date().toISOString(), passed, total: results.length, results }, null, 2));
  process.exit(passed === results.length ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
