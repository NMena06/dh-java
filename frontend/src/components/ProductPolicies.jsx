/**
 * Bloque de políticas (historia #26): ocupa el 100% del contenedor, título subrayado
 * y políticas en columnas, cada una con título y descripción.
 */
export default function ProductPolicies({ policies = [] }) {
  return (
    <section className="product-policies" aria-labelledby="policies-title">
      <h2 id="policies-title" className="underlined-title">Qué debes saber</h2>
      {policies.length === 0 ? (
        <p className="muted">Este producto todavía no tiene políticas cargadas.</p>
      ) : (
        <div className="policies-grid">
          {policies.map((policy, index) => (
            <article key={index} className="policy">
              <h3>{policy.title}</h3>
              <p>{policy.description}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
