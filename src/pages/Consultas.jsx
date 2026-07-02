import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/atenciones.css";

const FORM_ATENCION_INICIAL = {
  id_atencion: "",
  fecha: "",
  id_veterinario: "",
  motivo_consulta: "",
  diagnostico: "",
  observaciones: "",
};

function Consultas() {
  const [atenciones, setAtenciones] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);

  const [filtroMascota, setFiltroMascota] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [atencionEditando, setAtencionEditando] = useState(null);
  const [form, setForm] = useState(FORM_ATENCION_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarInformacion();
  }, []);

  async function cargarInformacion() {
    await Promise.all([cargarAtenciones(), cargarVeterinarios()]);
  }

  async function cargarVeterinarios() {
    const { data, error: err } = await supabase
      .from("tb_veterinario")
      .select("id_veterinario, nombre, especialidad")
      .order("nombre", { ascending: true });

    if (!err) {
      setVeterinarios(data || []);
    } else {
      console.error("Error cargando veterinarios:", err);
    }
  }

  async function cargarAtenciones() {
    setCargando(true);

    const { data, error: err } = await supabase
      .from("tb_atencion")
      .select(`
        id_atencion,
        id_mascota,
        id_veterinario,
        fecha,
        motivo,
        motivo_consulta,
        diagnostico,
        observaciones,
        tb_mascota(nombre, especie),
        tb_veterinario(nombre)
      `)
      .order("fecha", { ascending: false });

    if (!err) {
      setAtenciones(
        (data || []).map((atencion) => ({
          ...atencion,
          mascota: atencion.tb_mascota?.nombre || "Mascota no registrada",
          especie: atencion.tb_mascota?.especie || "",
          veterinario: atencion.tb_veterinario?.nombre || "Sin veterinario",
        }))
      );
    } else {
      console.error("Error cargando atenciones:", err);
    }

    setCargando(false);
  }

  const tiposAtencion = useMemo(() => {
    const tipos = new Set(
      atenciones
        .map((atencion) => atencion.motivo_consulta || atencion.motivo)
        .filter(Boolean)
    );

    return [...tipos];
  }, [atenciones]);

  const atencionesFiltradas = useMemo(() => {
    return atenciones.filter((atencion) => {
      const coincideMascota =
        !filtroMascota ||
        atencion.mascota
          ?.toLowerCase()
          .includes(filtroMascota.toLowerCase());

      const coincideFecha =
        !filtroFecha || atencion.fecha?.startsWith(filtroFecha);

      const motivoActual =
        atencion.motivo_consulta || atencion.motivo || "";

      const coincideTipo =
        !filtroTipo || motivoActual === filtroTipo;

      return coincideMascota && coincideFecha && coincideTipo;
    });
  }, [atenciones, filtroMascota, filtroFecha, filtroTipo]);

  function limpiarFiltros() {
    setFiltroMascota("");
    setFiltroFecha("");
    setFiltroTipo("");
  }

  function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";

    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function abrirModalEditar(atencion) {
    setAtencionEditando(atencion);

    setForm({
      id_atencion: atencion.id_atencion,
      fecha: atencion.fecha || "",
      id_veterinario: String(atencion.id_veterinario || ""),
      motivo_consulta: atencion.motivo_consulta || atencion.motivo || "",
      diagnostico: atencion.diagnostico || "",
      observaciones: atencion.observaciones || "",
    });

    setError("");
    setMostrarModal(true);
  }

  function cerrarModal() {
    if (guardando) return;

    setMostrarModal(false);
    setAtencionEditando(null);
    setForm(FORM_ATENCION_INICIAL);
    setError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  async function guardarCambios(e) {
    e.preventDefault();
    setError("");

    if (!form.fecha) {
      setError("Selecciona la fecha de atención.");
      return;
    }

    if (!form.id_veterinario) {
      setError("Selecciona al veterinario responsable.");
      return;
    }

    if (!form.motivo_consulta.trim()) {
      setError("Ingresa el motivo de atención.");
      return;
    }

    setGuardando(true);

    const { error: err } = await supabase
      .from("tb_atencion")
      .update({
        fecha: form.fecha,
        id_veterinario: Number(form.id_veterinario),
        motivo_consulta: form.motivo_consulta.trim(),
        motivo: form.motivo_consulta.trim(),
        diagnostico: form.diagnostico.trim() || null,
        observaciones: form.observaciones.trim() || null,
      })
      .eq("id_atencion", form.id_atencion);

    setGuardando(false);

    if (err) {
      console.error("Error actualizando atención:", err);
      setError(`No se pudo actualizar la atención: ${err.message}`);
      return;
    }

    cerrarModal();
    cargarAtenciones();
  }

  async function eliminarAtencion(atencion) {
    const { count, error: errorBusqueda } = await supabase
      .from("tb_detalle_tratamiento")
      .select("*", { count: "exact", head: true })
      .eq("id_atencion", atencion.id_atencion);

    if (errorBusqueda) {
      alert("No se pudo verificar si esta atención tiene tratamientos.");
      return;
    }

    if ((count || 0) > 0) {
      alert(
        "No se puede eliminar esta atención porque tiene tratamientos vinculados. Primero elimina los tratamientos relacionados."
      );
      return;
    }

    const confirmar = window.confirm(
      `¿Deseas eliminar la atención de ${atencion.mascota} del ${formatearFecha(
        atencion.fecha
      )}?`
    );

    if (!confirmar) return;

    const { error: err } = await supabase
      .from("tb_atencion")
      .delete()
      .eq("id_atencion", atencion.id_atencion);

    if (err) {
      console.error("Error eliminando atención:", err);
      alert("No se pudo eliminar la atención.");
      return;
    }

    cargarAtenciones();
  }

  return (
    <div className="atenciones-page">
      <section className="atenciones-hero">
        <div>
          <span className="atenciones-hero__tag">Historial clínico</span>
          <h1>Atenciones clínicas</h1>
          <p>
            Consulta los diagnósticos, motivos de atención y evolución médica
            de los pacientes registrados.
          </p>
        </div>

        <div className="atenciones-hero__summary">
          <span>Total de atenciones</span>
          <strong>{atenciones.length}</strong>
        </div>
      </section>

      <section className="atenciones-filter-panel">
        <div className="atenciones-filter-panel__header">
          <div className="atenciones-filter-panel__icon">🔎</div>

          <div>
            <h3>Buscar atenciones</h3>
            <p>Filtra el historial clínico por paciente, fecha o motivo.</p>
          </div>
        </div>

        <div className="atenciones-filter-grid">
          <label>
            Buscar mascota
            <input
              type="text"
              placeholder="Ejemplo: Max"
              value={filtroMascota}
              onChange={(e) => setFiltroMascota(e.target.value)}
            />
          </label>

          <label>
            Fecha
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
            />
          </label>

          <label>
            Tipo de atención
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="">Todos los tipos</option>

              {tiposAtencion.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </label>

          <button
            className="atenciones-clear-button"
            type="button"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      <section className="atenciones-results-header">
        <div>
          <span className="section-tag">Registro clínico</span>
          <h2>Atenciones registradas</h2>
          <p>
            {atencionesFiltradas.length}{" "}
            {atencionesFiltradas.length === 1
              ? "atención encontrada"
              : "atenciones encontradas"}
          </p>
        </div>
      </section>

      {cargando ? (
        <div className="atenciones-empty-state">
          <div className="atenciones-empty-state__icon">⏳</div>
          <h3>Cargando historial clínico...</h3>
          <p>Estamos obteniendo las atenciones registradas.</p>
        </div>
      ) : atencionesFiltradas.length === 0 ? (
        <div className="atenciones-empty-state">
          <div className="atenciones-empty-state__icon">📭</div>
          <h3>No hay atenciones para mostrar</h3>
          <p>Prueba modificando los filtros de búsqueda.</p>
        </div>
      ) : (
        <section className="atenciones-list">
          {atencionesFiltradas.map((item) => {
            const tieneDiagnostico = Boolean(item.diagnostico);

            return (
              <article key={item.id_atencion} className="atencion-prof-card">
                <div
                  className={`atencion-prof-card__accent ${
                    tieneDiagnostico
                      ? "atencion-prof-card__accent--completed"
                      : "atencion-prof-card__accent--pending"
                  }`}
                />

                <div className="atencion-prof-card__top">
                  <div className="atencion-prof-card__patient">
                    <div className="atencion-prof-card__avatar">
                      {item.especie?.toLowerCase().includes("gato")
                        ? "🐱"
                        : "🐶"}
                    </div>

                    <div>
                      <h3>{item.mascota}</h3>
                      <p>{item.especie || "Paciente veterinario"}</p>
                    </div>
                  </div>

                  <span
                    className={`atencion-status ${
                      tieneDiagnostico
                        ? "atencion-status--completed"
                        : "atencion-status--pending"
                    }`}
                  >
                    {tieneDiagnostico ? "Finalizada" : "En proceso"}
                  </span>
                </div>

                <div className="atencion-prof-card__content">
                  <div className="atencion-prof-card__main-info">
                    <span className="atencion-prof-card__label">
                      Motivo de atención
                    </span>

                    <h4>
                      {item.motivo_consulta ||
                        item.motivo ||
                        "Consulta veterinaria general"}
                    </h4>
                  </div>

                  <div className="atencion-diagnosis-box">
                    <span>Diagnóstico</span>
                    <p>
                      {item.diagnostico ||
                        "Aún no se registró un diagnóstico."}
                    </p>
                  </div>

                  {item.observaciones && (
                    <div className="atencion-observation-box">
                      <span>Observaciones</span>
                      <p>{item.observaciones}</p>
                    </div>
                  )}
                </div>

                <div className="atencion-management-actions">
                  <button
                    className="atencion-action-button atencion-action-button--edit"
                    type="button"
                    onClick={() => abrirModalEditar(item)}
                  >
                    Editar atención
                  </button>

                  <button
                    className="atencion-action-button atencion-action-button--delete"
                    type="button"
                    onClick={() => eliminarAtencion(item)}
                  >
                    Eliminar
                  </button>
                </div>

                <div className="atencion-prof-card__footer">
                  <div className="atencion-prof-card__meta">
                    <span>
                      <strong>Veterinario:</strong> {item.veterinario}
                    </span>

                    <span>
                      <strong>Fecha:</strong> {formatearFecha(item.fecha)}
                    </span>
                  </div>

                  <Link
                    to={`/mascota/${item.id_mascota}`}
                    className="atencion-prof-card__button"
                  >
                    Ver ficha clínica <span>→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {mostrarModal && (
        <div className="modal-overlay" onMouseDown={cerrarModal}>
          <form
            className="modal-content atenciones-modal"
            onSubmit={guardarCambios}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="atenciones-modal__header">
              <div>
                <span className="section-tag">Historial clínico</span>
                <h2>Editar atención</h2>
                <p>
                  Paciente:{" "}
                  <strong>{atencionEditando?.mascota || "Mascota"}</strong>
                </p>
              </div>

              <button
                className="atenciones-modal__close"
                type="button"
                onClick={cerrarModal}
                aria-label="Cerrar formulario"
              >
                ×
              </button>
            </div>

            <div className="atenciones-edit-grid">
              <label>
                Fecha de atención
                <input
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Veterinario responsable
                <select
                  name="id_veterinario"
                  value={form.id_veterinario}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona un veterinario</option>

                  {veterinarios.map((veterinario) => (
                    <option
                      key={veterinario.id_veterinario}
                      value={veterinario.id_veterinario}
                    >
                      {veterinario.nombre}
                      {veterinario.especialidad
                        ? ` — ${veterinario.especialidad}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="atenciones-edit-full">
              Motivo de atención
              <input
                type="text"
                name="motivo_consulta"
                value={form.motivo_consulta}
                onChange={handleChange}
                placeholder="Ejemplo: Control general, vacunación..."
                required
              />
            </label>

            <label className="atenciones-edit-full">
              Diagnóstico
              <textarea
                name="diagnostico"
                value={form.diagnostico}
                onChange={handleChange}
                rows="4"
                placeholder="Describe el diagnóstico."
              />
            </label>

            <label className="atenciones-edit-full">
              Observaciones
              <textarea
                name="observaciones"
                value={form.observaciones}
                onChange={handleChange}
                rows="4"
                placeholder="Indicaciones o recomendaciones."
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                className="atenciones-save-button"
                type="submit"
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Consultas;