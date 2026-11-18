import { useEffect, useId, useRef, useState } from 'react';
import DoubleCalendar from './DoubleCalendar.jsx';
import { getSuggestions } from '../services/searchService.js';
import { formatShort, fromISO, nightsBetween, toISO } from '../utils/dates.js';

/**
 * Bloque de búsqueda (historia #22): título, texto descriptivo, campo con autocompletado,
 * selector de rango con calendario doble y botón "Realizar búsqueda".
 * onSearch({ q, checkIn, checkOut }) con fechas "YYYY-MM-DD" o vacías.
 */
export default function SearchBar({ initial = {}, onSearch }) {
  const [query, setQuery] = useState(initial.q ?? '');
  const [range, setRange] = useState({ start: fromISO(initial.checkIn), end: fromISO(initial.checkOut) });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [active, setActive] = useState(-1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [error, setError] = useState('');
  const listId = useId();
  const wrapRef = useRef(null);

  // Sugerencias con espera de 200 ms para no consultar en cada tecla
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      getSuggestions(q)
        .then((list) => !cancelled && setSuggestions(list))
        .catch(() => !cancelled && setSuggestions([]));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submit = (q = query) => {
    if (range.start && !range.end) {
      setError('Elige también la fecha de salida');
      setCalendarOpen(true);
      return;
    }
    setError('');
    setShowSuggestions(false);
    setCalendarOpen(false);
    onSearch({ q: q.trim(), checkIn: toISO(range.start), checkOut: toISO(range.end) });
  };

  const pick = (suggestion) => {
    setQuery(suggestion.label);
    setShowSuggestions(false);
    setActive(-1);
    submit(suggestion.label);
  };

  const onKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const dateLabel = range.start
    ? `${formatShort(range.start)} — ${range.end ? formatShort(range.end) : 'salida'}`
    : 'Entrada — Salida';
  const nights = range.start && range.end ? nightsBetween(range.start, range.end) : 0;

  return (
    <section className="home-search" aria-labelledby="search-title">
      <h1 id="search-title">Busca ofertas en hoteles, autos, vuelos y mucho más</h1>
      <p className="search-intro">
        Escribe qué estás buscando y elige las fechas: te mostramos solo los productos disponibles, ordenados por relevancia.
      </p>

      <form className="search-form" ref={wrapRef} role="search"
        onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="search-field search-text">
          <label htmlFor="search-q" className="search-label">¿Qué buscas?</label>
          <input
            id="search-q"
            type="text"
            placeholder="Ej.: hotel, Bariloche, auto"
            value={query}
            autoComplete="off"
            role="combobox"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); setActive(-1); }}
            onFocus={() => { setShowSuggestions(true); setCalendarOpen(false); }}
            onKeyDown={onKeyDown}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="suggestions" id={listId} role="listbox">
              {suggestions.map((s, i) => (
                <li key={`${s.type}-${s.id}`} id={`${listId}-${i}`} role="option" aria-selected={i === active}
                  className={i === active ? 'active' : ''}
                  onMouseDown={(e) => { e.preventDefault(); pick(s); }}>
                  <span className={`sugg-icon ${s.type}`} aria-hidden="true">{s.type === 'category' ? '▦' : '⌕'}</span>
                  <span className="sugg-text">
                    <Highlight text={s.label} query={query} />
                    <small>{s.detail}</small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="search-field search-dates">
          <span className="search-label" id="dates-label">Fechas</span>
          <button type="button" className={`date-trigger ${range.start ? 'has-value' : ''}`}
            aria-labelledby="dates-label" aria-expanded={calendarOpen}
            onClick={() => { setCalendarOpen((v) => !v); setShowSuggestions(false); }}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span>{dateLabel}</span>
          </button>
          {calendarOpen && (
            <div className="calendar-popover">
              <DoubleCalendar value={range} onChange={setRange} label="Elegir fechas de entrada y salida" />
              <div className="calendar-footer">
                <span>{nights > 0 ? `${nights} ${nights === 1 ? 'noche' : 'noches'}` : 'Elige la entrada y luego la salida'}</span>
                <div className="toolbar-actions">
                  <button type="button" className="btn btn-outline-dark btn-sm"
                    onClick={() => setRange({ start: null, end: null })}>Borrar fechas</button>
                  <button type="button" className="btn btn-primary btn-sm" disabled={range.start && !range.end}
                    onClick={() => setCalendarOpen(false)}>Aplicar</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-accent search-submit">Realizar búsqueda</button>
      </form>
      {error && <p className="search-error" role="alert">{error}</p>}
    </section>
  );
}

/** Resalta en negrita la parte que coincide con lo escrito. */
function Highlight({ text, query }) {
  const strip = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const index = strip(text).indexOf(strip(query.trim()));
  if (!query.trim() || index < 0) return <span>{text}</span>;
  const end = index + query.trim().length;
  return (
    <span>
      {text.slice(0, index)}<mark>{text.slice(index, end)}</mark>{text.slice(end)}
    </span>
  );
}
