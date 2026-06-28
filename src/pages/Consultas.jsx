import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

function Consultas() {
  const [atenciones, setAtenciones] = useState([]);
  const [filtroMascota, setFiltroMascota] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  useEffect(() => {
    cargarAtenciones();
  }, []);

  /** Carga todas las atenciones clínicas con datos de mascota */
  async function cargarAtenciones() {
    const { data, error } = await supabase
      .from("tb_atencion")
      .select(`
        id_atencion,
        fecha,
        motivo_consulta,
        diagnostico,
        observaciones,
        id_mascota,
        tb_mascota(nombre),
        tb_veterinario(nombre)
      `)
      .order("fecha", { ascending: false });

    if (!error) {
      setAtenciones(
        data.map((a) => ({
          ...a,
          mascota: a.tb_mascota?.nombre,
          veterinario: a.tb_veterinario?.nombre,
        }))
      );
    } else {
      console.error("Error cargando atenciones:", error);
    }
  }

  /** Tipos de atención únicos para el filtro */
  const tiposAtencion = useMemo(() => {
    const tipos = new Set(atenciones.map((a) => a.motivo_consulta).filter(Boolean));
    return [...tipos];
  }, [atenciones]);

  /** Aplica filtros por nombre de mascota, fecha y tipo de atención */
  const atencionesFiltradas = useMemo(() => {
    return atenciones.filter((a) => {
      const matchMascota =
        !filtroMascota ||
        a.mascota?.toLowerCase().includes(filtroMascota.toLowerCase());
      const matchFecha = !filtroFecha || a.fecha?.startsWith(filtroFecha);
      const matchTipo = !filtroTipo || a.motivo_consulta === filtroTipo;
      return matchMascota && matchFecha && matchTipo;
    });
  }, [atenciones, filtroMascota, filtroFecha, filtroTipo]);

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1>Atenciones clínicas</h1>
          <p className="subtitle">Historial de consultas médicas y diagnósticos</p>
        </div>
      </div>

      {/* Barra de filtros profesional */}
      <div className="filter-bar">
        <label className="form-label">
          Mascota
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={filtroMascota}
            onChange={(e) => setFiltroMascota(e.target.value)}
          />
        </label>
        <label className="form-label">
          Fecha
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          />
        </label>
        <label className="form-label">
          Tipo de atención
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos</option>
            {tiposAtencion.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid cards-grid">
        {atencionesFiltradas.length === 0 ? (
          <p className="empty-message">No hay atenciones que coincidan con los filtros</p>
        ) : (
          atencionesFiltradas.map((item) => (
            <article key={item.id_atencion} className="atencion-card">
              <div className="atencion-card-header">
                <div>
                  <h3>{item.motivo_consulta}</h3>
                  <p>{new Date(item.fecha).toLocaleDateString()}</p>
                </div>
                <span className="badge">{item.veterinario || "Sin veterinario"}</span>
              </div>
              <div className="atencion-card-body">
                <div>
                  <strong>Mascota</strong>
                  <span>{item.mascota}</span>
                </div>
                <div>
                  <strong>Diagnóstico</strong>
                  <span>{item.diagnostico || "—"}</span>
                </div>
                <div>
                  <strong>Estado</strong>
                  <span>{item.diagnostico ? "Finalizada" : "En proceso"}</span>
                </div>
              </div>
              <Link to={`/mascota/${item.id_mascota}`} className="btn btn-secondary btn-small">
                Ver mascota
              </Link>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default Consultas;
