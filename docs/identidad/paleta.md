# Identidad de marca - ReservaYa

## Logo (provisional)

Archivo: [`logo.svg`](./logo.svg). Isologotipo con un icono de casa con marca de verificación (representa una reserva confirmada) y el nombre "ReservaYa", con "Ya" en el color de acento de la marca.

El logo es provisional. Se reemplaza sustituyendo `frontend/public/logo.svg` y `docs/identidad/logo.svg`.

## Paleta de colores

| Nombre | Hex | Uso |
|---|---|---|
| Violeta profundo | `#2b1a66` | Texto principal de marca, fondo del encabezado del detalle, footer, botón "Buscar" |
| Violeta principal | `#6c4fe0` | Color de marca: botones primarios, banner de búsqueda, icono del logo |
| Violeta claro | `#9b86f0` | Bordes secundarios y estados de paginación |
| Lavanda suave | `#efeafc` | Fondo general del sitio (`main`) |
| Ámbar | `#ffb703` | Acento: bordes de categorías y marca de verificación del logo |
| Blanco | `#ffffff` | Fondo de tarjetas, header y paneles |
| Gris texto | `#5d5d73` | Descripciones y textos secundarios |
| Rojo | `#c62828` | Errores y acción destructiva (eliminar producto) |

Los valores están definidos como variables CSS en `frontend/src/index.css` (`:root`).

## Contraste

- Blanco sobre `#6c4fe0`: cumple WCAG AA para texto normal.
- `#2b1a66` sobre `#ffffff`: cumple WCAG AAA.
- Texto `#5d5d73` sobre `#ffffff`: cumple WCAG AA.

## Tipografía

Pila del sistema (`system-ui`, `Segoe UI`, `Roboto`), sin fuentes externas, para que la carga sea inmediata.
