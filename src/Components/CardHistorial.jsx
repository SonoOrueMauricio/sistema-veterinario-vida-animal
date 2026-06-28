function CardHistorial({ title, date, vet, status, color = '#2563eb', children }) {
  return (
    <div className="historial-card" style={{ borderLeft: `6px solid ${color}` }}>
      <div>
        <div className="card-header">
          <h3>{title}</h3>
          <span className="status-pill">{status}</span>
        </div>

        <div className="card-meta">
          <span>{date}</span>
          <span>{vet}</span>
        </div>

        {children}

        <div className="card-actions">
          <button className="btn btn-secondary btn-small">Ver</button>
          <button className="btn btn-secondary btn-small">Editar</button>
          <button className="btn btn-primary btn-small">Facturar</button>
        </div>
      </div>
    </div>
  );
}

export default CardHistorial;
