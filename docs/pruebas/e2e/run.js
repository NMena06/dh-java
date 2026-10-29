const { chromium } = require('playwright-core');
const fs = require('fs');

const BASE = 'http://localhost:5173';
const API = 'http://localhost:8080/api/products';
const CAP = 'C:\\Users\\nico6\\Desktop\\ReservaYa\\docs\\pruebas\\capturas';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const results = [];
const check = (id, desc, ok, detail = '') => {
  results.push({ id, desc, ok: !!ok, detail });
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${id} ${desc} ${detail}`);
};

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const newPage = async (width, height) => {
    const ctx = await browser.newContext({ viewport: { width, height } });
    return ctx.newPage();
  };

  // Datos: asegurar mas de 10 productos para probar paginacion
  const existing = await (await fetch(`${API}/page?page=0&size=10`)).json();
  if (existing.totalElements < 12) {
    for (let i = existing.totalElements; i < 13; i++) {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Servicio de prueba ${i + 1}`, description: 'Producto generado para pruebas de paginacion.', images: ['data:image/png;base64,' + PNG.toString('base64')] }),
      });
    }
  }

  // ---- #1 / #2 / #7 Home desktop ----
  let page = await newPage(1366, 900);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  check('1.1', 'Header con logo y botones', await page.locator('header img[alt="ReservaYa"]').count() === 1 && await page.getByRole('button', { name: 'Crear cuenta' }).count() === 1);
  const headerPos = await page.locator('header').evaluate((el) => getComputedStyle(el).position);
  check('1.2', 'Header fijo (position: fixed)', headerPos === 'fixed', headerPos);
  await page.locator('.main h1').first().waitFor();
  const recCards = await page.locator('.home-section').nth(1).locator('.product-card').count();
  check('4.1', 'Recomendaciones: maximo 10', recCards <= 10 && recCards > 0, `(${recCards})`);
  const recCols = await page.locator('.home-section').nth(1).locator('.product-grid').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  check('4.4', 'Recomendaciones en 2 columnas (desktop)', recCols === 2, `(${recCols} columnas)`);
  check('7.1', 'Footer presente con logo y copyright', await page.locator('footer img[alt="ReservaYa"]').count() === 1 && (await page.locator('footer').innerText()).includes('ReservaYa'));
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${CAP}\\home-footer.png`, fullPage: true });

  // ---- #8 Paginacion ----
  const pagBefore = await page.locator('.pagination button.active').innerText();
  check('8.1', 'Paginacion muestra pagina 1 activa', pagBefore.trim() === '1', `(${pagBefore.trim()})`);
  const firstPageNames = await page.locator('.home-section').nth(2).locator('.product-card h3').allInnerTexts();
  check('8.2', 'Pagina tiene maximo 10 productos', firstPageNames.length <= 10 && firstPageNames.length > 0, `(${firstPageNames.length})`);
  await page.locator('.pagination button', { hasText: 'Siguiente' }).click();
  await page.waitForTimeout(800);
  const secondPageNames = await page.locator('.home-section').nth(2).locator('.product-card h3').allInnerTexts();
  check('8.3', 'Boton Siguiente cambia de pagina', (await page.locator('.pagination button.active').innerText()).trim() === '2' && secondPageNames.join() !== firstPageNames.join());
  check('8.4', 'Boton Anterior habilitado en pagina 2', !(await page.locator('.pagination button', { hasText: 'Anterior' }).isDisabled()));
  await page.locator('.pagination button', { hasText: 'Inicio' }).click();
  await page.waitForTimeout(500);
  check('8.5', 'Boton Inicio vuelve a pagina 1', (await page.locator('.pagination button.active').innerText()).trim() === '1');
  check('8.6', 'Boton Inicio deshabilitado en pagina 1', await page.locator('.pagination button', { hasText: 'Inicio' }).isDisabled());
  await page.screenshot({ path: `${CAP}\\paginacion.png`, fullPage: false });

  // ---- #1.3 logo redirige ----
  await page.goto(`${BASE}/administracion`, { waitUntil: 'networkidle' });
  await page.locator('header .brand').click();
  await page.waitForURL(BASE + '/');
  check('1.3', 'Clic en logo redirige al inicio', new URL(page.url()).pathname === '/');

  // ---- #3 Registrar producto (formulario) ----
  await page.goto(`${BASE}/administracion`, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Agregar producto' }).click();
  await page.waitForURL('**/administracion/productos/nuevo');
  const galleryName = 'Hotel Galeria Completa';
  await page.getByLabel('Nombre').fill(galleryName);
  await page.getByLabel('Descripción').fill('Producto con cinco imagenes para probar la galeria completa.');
  const fiveImages = Array.from({ length: 5 }, (_, i) => ({ name: `foto${i + 1}.png`, mimeType: 'image/png', buffer: PNG }));
  await page.locator('input[type=file]').setInputFiles(fiveImages);
  check('3.5', 'Permite seleccionar varias imagenes', (await page.locator('text=5 imagen(es) seleccionada(s)').count()) === 1);
  await page.getByRole('button', { name: 'Guardar producto' }).click();
  await page.waitForURL('**/administracion/productos', { timeout: 15000 });
  check('3.1', 'Guardar producto redirige a la lista', true);
  await page.locator('tbody tr').first().waitFor();
  check('3.2', 'Producto aparece en la lista de administracion', (await page.getByText(galleryName).count()) >= 1);

  // 3.3 nombre duplicado en UI
  await page.goto(`${BASE}/administracion/productos/nuevo`, { waitUntil: 'networkidle' });
  await page.getByLabel('Nombre').fill(galleryName.toUpperCase());
  await page.getByLabel('Descripción').fill('Intento duplicado');
  await page.locator('input[type=file]').setInputFiles([{ name: 'a.png', mimeType: 'image/png', buffer: PNG }]);
  await page.getByRole('button', { name: 'Guardar producto' }).click();
  const dupMsg = await page.getByRole('alert').innerText();
  check('3.4', 'Nombre duplicado muestra error en pantalla', dupMsg.includes('ya esta en uso'), `("${dupMsg}")`);
  await page.screenshot({ path: `${CAP}\\form-duplicado.png` });

  // ---- #6 Galeria con 5+ imagenes ----
  await page.goto(`${BASE}/administracion/productos`, { waitUntil: 'networkidle' });
  const galleryId = await page.locator('tr', { hasText: galleryName }).first().locator('td').first().innerText();
  await page.goto(`${BASE}/productos/${galleryId.trim()}`, { waitUntil: 'networkidle' });
  check('6.4', 'Boton "Ver mas" visible con 5 imagenes', await page.getByRole('button', { name: 'Ver más' }).count() === 1);
  await page.getByRole('button', { name: 'Ver más' }).click();
  const modalImgs = await page.locator('.modal-grid img').count();
  check('6.5', 'Modal muestra todas las imagenes (5)', modalImgs === 5, `(${modalImgs})`);
  await page.screenshot({ path: `${CAP}\\galeria-modal.png` });
  await page.locator('.modal-header button').click();
  check('6.6', 'Modal se cierra', await page.locator('.modal').count() === 0);

  // ---- #5 Detalle: flecha volver ----
  await page.getByRole('button', { name: 'Volver atrás' }).click();
  await page.waitForTimeout(500);
  check('5.3', 'Flecha vuelve a la pagina anterior', !page.url().includes(`/productos/${galleryId.trim()}`), `(${page.url()})`);

  // ---- #11 Eliminar: cancelar y aceptar ----
  await page.goto(`${BASE}/administracion/productos`, { waitUntil: 'networkidle' });
  const rowsBefore = await page.locator('tbody tr').count();
  page.once('dialog', (d) => d.dismiss());
  await page.locator('tr', { hasText: galleryName }).first().getByRole('button', { name: 'Eliminar producto' }).click();
  await page.waitForTimeout(800);
  check('11.2', 'Cancelar confirmacion no elimina', (await page.locator('tbody tr').count()) === rowsBefore);
  page.once('dialog', (d) => d.accept());
  await page.locator('tr', { hasText: galleryName }).first().getByRole('button', { name: 'Eliminar producto' }).click();
  await page.waitForTimeout(1000);
  check('11.3', 'Aceptar confirmacion elimina de la lista', (await page.locator('tbody tr', { hasText: galleryName }).count()) === 0);
  const apiGone = await fetch(`${API}/${galleryId.trim()}`);
  check('11.4', 'Producto eliminado responde 404 en API', apiGone.status === 404, `(${apiGone.status})`);
  await page.screenshot({ path: `${CAP}\\admin-lista.png` });

  // ---- #9 / #10 Panel y lista desktop ----
  await page.goto(`${BASE}/administracion`, { waitUntil: 'networkidle' });
  check('9.2', 'Panel muestra botones Agregar y Lista', (await page.getByRole('link', { name: 'Lista de productos' }).count()) === 1 && (await page.getByRole('link', { name: 'Agregar producto' }).count()) === 1);
  await page.screenshot({ path: `${CAP}\\admin-panel.png` });

  // ---- Responsive (movil 390px) ----
  page = await newPage(390, 844);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('.main h1').first().waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('1.4', 'Movil: sin desbordamiento horizontal en home', overflow <= 0, `(exceso ${overflow}px)`);
  await page.screenshot({ path: `${CAP}\\movil-home.png` });

  await page.goto(`${BASE}/administracion`, { waitUntil: 'networkidle' });
  const adminMsgVisible = await page.locator('.admin-mobile-msg').isVisible();
  const adminDesktopHidden = !(await page.locator('.admin-desktop').isVisible());
  check('9.3', 'Movil: panel muestra aviso y oculta contenido', adminMsgVisible && adminDesktopHidden);
  await page.screenshot({ path: `${CAP}\\movil-admin.png` });

  await page.goto(`${BASE}/productos/${existing.content[0].id}`, { waitUntil: 'networkidle' });
  const detOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('6.7', 'Movil: detalle/galeria sin desbordamiento', detOverflow <= 0, `(exceso ${detOverflow}px)`);
  await page.screenshot({ path: `${CAP}\\movil-detalle.png`, fullPage: true });

  await browser.close();
  fs.writeFileSync('C:\\Users\\nico6\\AppData\\Local\\Temp\\opencode\\e2e\\results.json', JSON.stringify(results, null, 2));
  const fails = results.filter((r) => !r.ok).length;
  console.log(`\nTOTAL ${results.length} | OK ${results.length - fails} | FALLA ${fails}`);
})().catch((e) => { console.error('ERROR SCRIPT', e); process.exit(1); });
