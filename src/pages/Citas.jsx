import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

const FORM_CITA = {
  id_mascota: "",
  fecha: "",
  hora: "",
  estado: "Pendiente",
};

function Citas() {
  const [citas, setCitas] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [form, setForm] = useState(FORM_CITA);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarCitas();
    cargarMascotas();
  }, [filtroFecha]);

  /** Lista mascotas para el selector al crear cita */
  async function cargarMascotas() {
    const { data } = await supabase
      .from("tb_mascota")
      .select("id_mascota, nombre")
      .order("nombre");
    setMascotas(data || []);
  }

  /** Carga citas desde Supabase con filtro opcional por fecha */
  async function cargarCitas() {
    let query = supabase
      .from("tb_cita")
      .select(`
        id_cita,
        fecha,
        hora,
        estado,
        id_mascota,
        tb_mascota(nombre)
      `)
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true });

    if (filtroFecha) {
      query = query.eq("fecha", filtroFecha);
    }

    const { data, error: err } = await query;

    if (!err) {
      setCitas(
        data.map((c) => ({
          ...c,
          mascota: c.tb_mascota?.nombre,
        }))
      );
    } else {
      console.error("Error cargando citas:", err);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  /** Registra una nueva cita en tb_cita */
  async function guardarCita() {
    setError("");
    const { error: err } = await supabase.from("tb_cita").insert([
      {
        id_mascota: form.id_mascota,
        fecha: form.fecha,
        hora: form.hora,
        estado: form.estado,
      },
    ]);

    if (!err) {
      setMostrarModal(false);
      setForm(FORM_CITA);
      cargarCitas();
    } else {
      setError("Error al crear cita: " + err.message);
    }
  }

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1>Citas programadas</h1>
          <p className="subtitle">Gestión de agenda y atenciones clínicas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setMostrarModal(true)}>
          + Nueva cita
        </button>
      </div>

      {/* Filtro por fecha */}
      <div className="filter-bar">
        <label className="form-label">
          Filtrar por fecha
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          />
        </label>
        {filtroFecha && (
          <button className="btn btn-secondary btn-small" onClick={() => setFiltroFecha("")}>
            Limpiar filtro
          </button>
        )}
      </div>

      <div className="grid cards-grid">
        {citas.length === 0 ? (
          <p className="empty-message">No hay citas para mostrar</p>
        ) : (
          citas.map((cita) => (
            <div key={cita.id_cita} className="cita-card">
              <div className="cita-card-meta">
                <span><strong>Fecha:</strong> {cita.fecha}</span>
                <span><strong>Hora:</strong> {cita.hora}</span>
              </div>
              <h3>{cita.mascota}</h3>
              <p>
                Estado:{" "}
                <span className={`status-tag status-${cita.estado?.toLowerCase()}`}>
                  {cita.estado}
                </span>
              </p>
              <Link to={`/mascota/${cita.id_mascota}`} className="btn btn-secondary btn-small">
                Ver mascota
              </Link>
            </div>
          ))
        )}
      </div>

      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva cita</h2>

            <div className="form-grid">
              <label className="form-label">
                Mascota
                <select name="id_mascota" value={form.id_mascota} onChange={handleChange}>
                  <option value="">Seleccionar mascota</option>
                  {mascotas.map((m) => (
                    <option key={m.id_mascota} value={m.id_mascota}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-label">
                Fecha
                <input type="date" name="fecha" value={form.fecha} onChange={handleChange} />
              </label>
              <label className="form-label">
                Hora
                <input type="time" name="hora" value={form.hora} onChange={handleChange} />
              </label>
              <label className="form-label">
                Estado
                <select name="estado" value={form.estado} onChange={handleChange}>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Atendido">Atendido</option>
                </select>
              </label>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={guardarCita}>
                Guardar
              </button>
              <button className="btn btn-secondary" onClick={() => setMostrarModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Citas;
