function CardAtencion({ atencion }) {
  return (
    <article className="atencion-card">
      <div className="atencion-card-header">
        <div>
          <h3>{atencion.motivo_consulta}</h3>
          <p>{atencion.fecha}</p>
        </div>
        <span className="badge badge-secondary">{atencion.veterinario}</span>
      </div>

      <div className="atencion-card-body">
        <div>
          <strong>Diagnóstico</strong>
          <span>{atencion.diagnostico}</span>
        </div>
        <div>
          <strong>Estado</strong>
          <span>{atencion.estado || 'Registrado'}</span>
        </div>
      </div>
    </article>
  );
}

export default CardAtencion;
