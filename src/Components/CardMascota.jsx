import { Link } from "react-router-dom";

function CardMascota({ mascota }) {
  return (
    <article className="mascota-card">
      <div className="mascota-card-header">
        <div>
          <h3>{mascota.nombre}</h3>
          <p>{mascota.especie} · {mascota.raza}</p>
        </div>
        <span className="badge">{mascota.sexo}</span>
      </div>

      <div className="mascota-card-body">
        <div>
          <strong>Edad</strong>
          <span>{mascota.edad}</span>
        </div>
        <div>
          <strong>Peso</strong>
          <span>{mascota.peso}</span>
        </div>
        <div>
          <strong>Dueño</strong>
          <span>{mascota.duenio}</span>
        </div>
      </div>

      <div className="mascota-card-footer">
        <Link to={`/mascota/${mascota.id_mascota}`} className="btn btn-secondary btn-small">
          Ver detalle
        </Link>
      </div>
    </article>
  );
}

export default CardMascota;
