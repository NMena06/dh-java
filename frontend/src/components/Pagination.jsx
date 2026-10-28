export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const isFirst = page === 0;
  const isLast = page >= totalPages - 1;

  return (
    <nav className="pagination" aria-label="Paginación de productos">
      <button type="button" className="btn btn-outline-dark" onClick={() => onChange(0)} disabled={isFirst}>
        Inicio
      </button>
      <button type="button" className="btn btn-outline-dark" onClick={() => onChange(page - 1)} disabled={isFirst}>
        Anterior
      </button>

      {Array.from({ length: totalPages }).map((_, index) => (
        <button
          key={index}
          type="button"
          className={`btn btn-page ${index === page ? 'active' : ''}`}
          onClick={() => onChange(index)}
          aria-current={index === page ? 'page' : undefined}
        >
          {index + 1}
        </button>
      ))}

      <button type="button" className="btn btn-outline-dark" onClick={() => onChange(page + 1)} disabled={isLast}>
        Siguiente
      </button>
    </nav>
  );
}
