import { Link } from "react-router-dom";

function CardMascota({ mascota, onEditar, onEliminar }) {
  if (!mascota) return null;

  const especie = mascota.especie?.toLowerCase() || "";
  const iconoMascota = especie.includes("gato") ? "🐱" : "🐶";

  return (
    <article className="pet-card">
      <div className="pet-card__accent" />

      <div className="pet-card__header">
        <div className="pet-card__identity">
          <div className="pet-card__avatar">{iconoMascota}</div>

          <div>
            <h3>{mascota.nombre || "Sin nombre"}</h3>
            <p>
              {mascota.especie || "Sin especie"} ·{" "}
              {mascota.raza || "Sin raza"}
            </p>
          </div>
        </div>

        <span
          className={`pet-card__sex ${
            mascota.sexo === "Hembra" ? "pet-card__sex--female" : ""
          }`}
        >
          {mascota.sexo || "Sin registro"}
        </span>
      </div>

      <div className="pet-card__details">
        <div className="pet-card__detail">
          <span>Edad</span>
          <strong>{mascota.edad ?? "—"} años</strong>
        </div>

        <div className="pet-card__detail">
          <span>Peso</span>
          <strong>{mascota.peso ?? "—"} kg</strong>
        </div>
      </div>

      <div className="pet-card__owner">
        <span className="pet-card__owner-label">Propietario</span>
        <strong>{mascota.duenio || "Sin propietario registrado"}</strong>
      </div>

      <div className="pet-card__actions">
        <Link to={`/mascota/${mascota.id_mascota}`} className="pet-card__button">
          Ver ficha clínica <span>→</span>
        </Link>

        <div className="pet-card__management">
          <button
            type="button"
            className="pet-card__edit"
            onClick={() => onEditar?.(mascota)}
          >
            Editar
          </button>

          <button
            type="button"
            className="pet-card__delete"
            onClick={() => onEliminar?.(mascota)}
          >
            Eliminar
          </button>
        </div>
      </div>
    </article>
  );
}

export default CardMascota;