import { useMemo, useState } from 'react';
import {
  addDays, addMonths, MONTHS, sameDay, startOfMonth, toISO, today as getToday, WEEKDAYS,
} from '../utils/dates.js';

/**
 * Calendario doble (dos meses lado a lado) para elegir un rango de fechas (historias #22 y #23).
 *
 * - value: { start: Date|null, end: Date|null }, onChange(value)
 * - booked: Set de dias "YYYY-MM-DD" ocupados; se muestran tachados y no se pueden elegir
 * - minDate: no se pueden elegir dias anteriores (por defecto hoy)
 * - selectable: false para solo mostrar la disponibilidad
 *
 * Un rango no puede incluir noches ocupadas: el dia de salida si puede coincidir con el inicio de otra reserva.
 */
export default function DoubleCalendar({
  value = { start: null, end: null }, onChange, booked = new Set(), minDate, selectable = true, label = 'Calendario',
}) {
  const todayDate = getToday();
  const min = minDate ?? todayDate;
  const [month, setMonth] = useState(() => startOfMonth(value.start ?? todayDate));
  const [hover, setHover] = useState(null);

  const months = [month, addMonths(month, 1)];
  const canGoBack = month > startOfMonth(min);

  const rangeEnd = value.end ?? (value.start && hover && hover > value.start ? hover : null);

  /** true si alguna noche entre start (incl.) y end (excl.) esta ocupada */
  const crossesBooked = useMemo(() => (start, end) => {
    for (let d = start; d < end; d = addDays(d, 1)) if (booked.has(toISO(d))) return true;
    return false;
  }, [booked]);

  const handleClick = (day) => {
    if (!selectable || !onChange) return;
    const iso = toISO(day);
    if (!value.start || value.end || day <= value.start) {
      if (booked.has(iso)) return; // no se puede entrar un dia ocupado
      onChange({ start: day, end: null });
      return;
    }
    if (crossesBooked(value.start, day)) {
      onChange({ start: booked.has(iso) ? null : day, end: null });
      return;
    }
    onChange({ start: value.start, end: day });
  };

  return (
    <div className="dcal" role="group" aria-label={label}>
      <div className="dcal-nav">
        <button type="button" className="dcal-arrow" onClick={() => setMonth(addMonths(month, -1))}
          disabled={!canGoBack} aria-label="Mes anterior">‹</button>
        <button type="button" className="dcal-arrow" onClick={() => setMonth(addMonths(month, 1))}
          aria-label="Mes siguiente">›</button>
      </div>
      <div className="dcal-months">
        {months.map((m) => (
          <Month key={toISO(m)} month={m} min={min} value={value} rangeEnd={rangeEnd} booked={booked}
            selectable={selectable} todayDate={todayDate} onPick={handleClick} onHover={setHover} />
        ))}
      </div>
    </div>
  );
}

function Month({ month, min, value, rangeEnd, booked, selectable, todayDate, onPick, onHover }) {
  const first = startOfMonth(month);
  const leading = (first.getDay() + 6) % 7; // lunes primero
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < leading; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), d));

  return (
    <div className="dcal-month">
      <div className="dcal-title">{MONTHS[month.getMonth()]} {month.getFullYear()}</div>
      <div className="dcal-grid" role="grid">
        {WEEKDAYS.map((w) => <span key={w} className="dcal-weekday" aria-hidden="true">{w}</span>)}
        {cells.map((day, i) => {
          if (!day) return <span key={`e${i}`} className="dcal-empty" />;
          const iso = toISO(day);
          const past = day < min;
          const isBooked = !past && booked.has(iso); // los dias pasados se ven siempre como no disponibles
          const isStart = sameDay(day, value.start);
          const isEnd = sameDay(day, value.end);
          const inRange = value.start && rangeEnd && day > value.start && day < rangeEnd;
          const classes = ['dcal-day'];
          if (past) classes.push('past');
          if (isBooked) classes.push('booked');
          else if (!past) classes.push('available');
          if (isStart || isEnd) classes.push('selected');
          if (inRange) classes.push('in-range');
          if (sameDay(day, todayDate)) classes.push('today');
          const status = isBooked ? 'ocupado' : past ? 'no disponible' : 'disponible';
          return (
            <button
              key={iso}
              type="button"
              className={classes.join(' ')}
              data-date={iso}
              disabled={past || !selectable}
              aria-label={`${day.getDate()} de ${MONTHS[day.getMonth()]}, ${status}`}
              aria-pressed={isStart || isEnd || undefined}
              onClick={() => onPick(day)}
              onMouseEnter={() => onHover(day)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
