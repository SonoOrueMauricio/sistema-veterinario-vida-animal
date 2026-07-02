import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/citas.css";

const FORM_CITA_INICIAL = {
  id_mascota: "",
  fecha: "",
  hora: "",
  motivo: "",
  estado: "Pendiente",
};

function Citas() {
  const [citas, setCitas] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [citaEditando, setCitaEditando] = useState(null);
  const [form, setForm] = useState(FORM_CITA_INICIAL);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarCitas();
  }, [filtroFecha]);

  useEffect(() => {
    cargarMascotas();
  }, []);

  async function cargarMascotas() {
    const { data, error: err } = await supabase
      .from("tb_mascota")
      .select("id_mascota, nombre, especie")
      .order("nombre");

    if (!err) {
      setMascotas(data || []);
    } else {
      console.error("Error cargando mascotas:", err);
    }
  }

  async function cargarCitas() {
    setCargando(true);

    let query = supabase
      .from("tb_cita")
      .select(`
        id_cita,
        fecha,
        hora,
        estado,
        motivo,
        id_mascota,
        tb_mascota(nombre, especie)
      `)
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true });

    if (filtroFecha) {
      query = query.eq("fecha", filtroFecha);
    }

    const { data, error: err } = await query;

    if (!err) {
      setCitas(
        (data || []).map((cita) => ({
          ...cita,
          mascota: cita.tb_mascota?.nombre || "Mascota no encontrada",
          especie: cita.tb_mascota?.especie || "",
        }))
      );
    } else {
      console.error("Error cargando citas:", err);
    }

    setCargando(false);
  }

  function abrirModalNuevaCita() {
    setCitaEditando(null);
    setForm(FORM_CITA_INICIAL);
    setError("");
    setMostrarModal(true);
  }

  function abrirModalEditar(cita) {
    setCitaEditando(cita);

    setForm({
      id_mascota: String(cita.id_mascota),
      fecha: cita.fecha || "",
      hora: cita.hora?.slice(0, 5) || "",
      motivo: cita.motivo || "",
      estado: cita.estado || "Pendiente",
    });

    setError("");
    setMostrarModal(true);
  }

  function cerrarModal() {
    if (guardando) return;

    setMostrarModal(false);
    setCitaEditando(null);
    setForm(FORM_CITA_INICIAL);
    setError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((estadoAnterior) => ({
      ...estadoAnterior,
      [name]: value,
    }));
  }

  async function guardarCita(e) {
    e.preventDefault();
    setError("");

    if (!form.id_mascota || !form.fecha || !form.hora) {
      setError("Selecciona la mascota, fecha y hora de la cita.");
      return;
    }

    setGuardando(true);

    const datosCita = {
      id_mascota: Number(form.id_mascota),
      fecha: form.fecha,
      hora: form.hora,
      motivo: form.motivo.trim() || null,
      estado: form.estado,
    };

    let err;

    if (citaEditando) {
      const respuesta = await supabase
        .from("tb_cita")
        .update(datosCita)
        .eq("id_cita", citaEditando.id_cita);

      err = respuesta.error;
    } else {
      const respuesta = await supabase.from("tb_cita").insert(datosCita);
      err = respuesta.error;
    }

    setGuardando(false);

    if (err) {
      console.error("Error guardando cita:", err);
      setError(`No se pudo guardar la cita: ${err.message}`);
      return;
    }

    cerrarModal();
    cargarCitas();
  }

  async function cambiarEstado(cita, nuevoEstado) {
    if (nuevoEstado === "Atendida" && esCitaFutura(cita.fecha)) {
      alert("No puedes marcar como atendida una cita de fecha futura.");
      return;
    }

    const { error: err } = await supabase
      .from("tb_cita")
      .update({ estado: nuevoEstado })
      .eq("id_cita", cita.id_cita);

    if (err) {
      console.error("Error cambiando estado:", err);
      alert("No se pudo actualizar el estado de la cita.");
      return;
    }

    cargarCitas();
  }

  async function eliminarCita(cita) {
    const confirmar = window.confirm(
      `¿Deseas eliminar la cita de ${cita.mascota} del ${formatearFecha(
        cita.fecha
      )}?`
    );

    if (!confirmar) return;

    const { error: err } = await supabase
      .from("tb_cita")
      .delete()
      .eq("id_cita", cita.id_cita);

    if (err) {
      console.error("Error eliminando cita:", err);
      alert("No se pudo eliminar la cita.");
      return;
    }

    cargarCitas();
  }

  function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";

    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatearHora(hora) {
    if (!hora) return "--:--";

    return hora.slice(0, 5);
  }

  function esCitaFutura(fecha) {
    if (!fecha) return false;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaCita = new Date(`${fecha}T00:00:00`);
    fechaCita.setHours(0, 0, 0, 0);

    return fechaCita > hoy;
  }

  function obtenerClaseEstado(estado) {
    if (estado === "Atendida" || estado === "Atendido") {
      return "cita-status--attended";
    }

    if (estado === "Cancelada") {
      return "cita-status--cancelled";
    }

    return "cita-status--pending";
  }

  const resumen = useMemo(() => {
    const pendientes = citas.filter(
      (cita) => cita.estado === "Pendiente"
    ).length;

    const atendidas = citas.filter(
      (cita) =>
        cita.estado === "Atendida" || cita.estado === "Atendido"
    ).length;

    const canceladas = citas.filter(
      (cita) => cita.estado === "Cancelada"
    ).length;

    return {
      total: citas.length,
      pendientes,
      atendidas,
      canceladas,
    };
  }, [citas]);

  return (
    <div className="citas-page">
      <section className="citas-hero">
        <div>
          <span className="citas-hero__tag">Agenda clínica</span>
          <h1>Citas programadas</h1>
          <p>
            Organiza la atención veterinaria, consulta la agenda y registra
            nuevas citas para los pacientes.
          </p>
        </div>

        <button
          className="citas-new-button"
          type="button"
          onClick={abrirModalNuevaCita}
        >
          <span>＋</span>
          Nueva cita
        </button>
      </section>

      <section className="citas-summary-grid">
        <article className="citas-summary-card citas-summary-card--blue">
          <span className="citas-summary-card__icon">📅</span>
          <div>
            <small>Total de citas</small>
            <strong>{resumen.total}</strong>
          </div>
        </article>

        <article className="citas-summary-card citas-summary-card--orange">
          <span className="citas-summary-card__icon">⏳</span>
          <div>
            <small>Pendientes</small>
            <strong>{resumen.pendientes}</strong>
          </div>
        </article>

        <article className="citas-summary-card citas-summary-card--green">
          <span className="citas-summary-card__icon">✓</span>
          <div>
            <small>Atendidas</small>
            <strong>{resumen.atendidas}</strong>
          </div>
        </article>

        <article className="citas-summary-card citas-summary-card--red">
          <span className="citas-summary-card__icon">✕</span>
          <div>
            <small>Canceladas</small>
            <strong>{resumen.canceladas}</strong>
          </div>
        </article>
      </section>

      <section className="citas-filter-panel">
        <div className="citas-filter-panel__title">
          <span>📆</span>

          <div>
            <h3>Filtrar agenda</h3>
            <p>Selecciona una fecha para visualizar las citas programadas.</p>
          </div>
        </div>

        <div className="citas-filter-panel__actions">
          <label className="citas-date-field">
            <span>Fecha de atención</span>

            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
            />
          </label>

          {filtroFecha && (
            <button
              className="citas-clear-button"
              type="button"
              onClick={() => setFiltroFecha("")}
            >
              Limpiar filtro
            </button>
          )}
        </div>
      </section>

      <section className="citas-list-header">
        <div>
          <h2>
            {filtroFecha ? "Citas del día seleccionado" : "Próximas citas"}
          </h2>

          <p>
            {citas.length}{" "}
            {citas.length === 1 ? "cita registrada" : "citas registradas"}
          </p>
        </div>
      </section>

      {cargando ? (
        <div className="citas-empty-state">
          <div className="citas-empty-state__icon">⏳</div>
          <h3>Cargando citas...</h3>
          <p>Estamos consultando la agenda clínica.</p>
        </div>
      ) : citas.length === 0 ? (
        <div className="citas-empty-state">
          <div className="citas-empty-state__icon">📭</div>
          <h3>No hay citas para mostrar</h3>
          <p>Registra una nueva cita o cambia el filtro de fecha.</p>

          <button
            className="citas-new-button"
            type="button"
            onClick={abrirModalNuevaCita}
          >
            Registrar cita
          </button>
        </div>
      ) : (
        <section className="citas-cards-grid">
          {citas.map((cita) => {
            const esAtendida =
              cita.estado === "Atendida" || cita.estado === "Atendido";

            const esCancelada = cita.estado === "Cancelada";
            const esFutura = esCitaFutura(cita.fecha);

            return (
              <article key={cita.id_cita} className="cita-professional-card">
                <div
                  className={`cita-professional-card__accent ${
                    esAtendida
                      ? "cita-professional-card__accent--green"
                      : esCancelada
                      ? "cita-professional-card__accent--red"
                      : "cita-professional-card__accent--orange"
                  }`}
                />

                <div className="cita-professional-card__top">
                  <div className="cita-professional-card__date-box">
                    <span>{formatearFecha(cita.fecha)}</span>
                    <strong>{formatearHora(cita.hora)}</strong>
                  </div>

                  <span
                    className={`cita-status ${obtenerClaseEstado(
                      cita.estado
                    )}`}
                  >
                    {cita.estado || "Pendiente"}
                  </span>
                </div>

                <div className="cita-professional-card__pet">
                  <div className="cita-professional-card__pet-icon">
                    {cita.especie?.toLowerCase().includes("gato")
                      ? "🐱"
                      : "🐶"}
                  </div>

                  <div>
                    <h3>{cita.mascota}</h3>
                    <p>{cita.especie || "Paciente veterinario"}</p>
                  </div>
                </div>

                <div className="cita-professional-card__reason">
                  <span>Motivo de cita</span>
                  <p>{cita.motivo || "Consulta veterinaria general"}</p>
                </div>

                <div className="cita-professional-card__actions">
                  {!esAtendida && !esCancelada && (
                    <>
                      {!esFutura && (
                        <button
                          className="cita-action-button cita-action-button--attend"
                          type="button"
                          onClick={() => cambiarEstado(cita, "Atendida")}
                        >
                          ✓ Atendida
                        </button>
                      )}

                      <button
                        className="cita-action-button cita-action-button--cancel"
                        type="button"
                        onClick={() => cambiarEstado(cita, "Cancelada")}
                      >
                        Cancelar
                      </button>
                    </>
                  )}

                  <button
                    className="cita-action-button cita-action-button--edit"
                    type="button"
                    onClick={() => abrirModalEditar(cita)}
                  >
                    Editar
                  </button>

                  <button
                    className="cita-action-button cita-action-button--delete"
                    type="button"
                    onClick={() => eliminarCita(cita)}
                  >
                    Eliminar
                  </button>
                </div>

                <div className="cita-professional-card__footer">
                  <span className="cita-professional-card__label">
                    Ficha clínica del paciente
                  </span>

                  <Link
                    to={`/mascota/${cita.id_mascota}`}
                    className="cita-professional-card__button"
                  >
                    Ver ficha <span>→</span>
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
            className="modal-content citas-modal"
            onSubmit={guardarCita}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="citas-modal__header">
              <div>
                <span className="section-tag">Agenda clínica</span>

                <h2>
                  {citaEditando ? "Editar cita" : "Registrar nueva cita"}
                </h2>

                <p>
                  {citaEditando
                    ? "Actualiza la información de la cita seleccionada."
                    : "Selecciona el paciente y programa la atención veterinaria."}
                </p>
              </div>

              <button
                className="citas-modal__close"
                onClick={cerrarModal}
                type="button"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="citas-form-section">
              <div className="citas-form-section__title">
                <span>🐾</span>

                <div>
                  <h3>Información de la cita</h3>
                  <p>Completa los datos para registrar la atención.</p>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  Mascota *
                  <select
                    name="id_mascota"
                    value={form.id_mascota}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar mascota</option>

                    {mascotas.map((mascota) => (
                      <option
                        key={mascota.id_mascota}
                        value={mascota.id_mascota}
                      >
                        {mascota.nombre}
                        {mascota.especie ? ` - ${mascota.especie}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Fecha *
                  <input
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Hora *
                  <input
                    type="time"
                    name="hora"
                    value={form.hora}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Estado
                  <select
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Atendida">Atendida</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </label>
              </div>

              <label className="citas-motivo-field">
                Motivo de la cita
                <textarea
                  name="motivo"
                  value={form.motivo}
                  onChange={handleChange}
                  placeholder="Ejemplo: Control general, vacunación, revisión médica..."
                  rows="3"
                />
              </label>
            </div>

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
                className="citas-save-button"
                type="submit"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : citaEditando
                  ? "Guardar cambios"
                  : "Guardar cita"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Citas;