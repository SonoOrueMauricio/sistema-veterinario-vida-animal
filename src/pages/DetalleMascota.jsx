import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useBreadcrumb } from "../context/BreadcrumbContext";
import "../styles/detalleMascota.css";

const FORM_ATENCION_INICIAL = {
  fecha: new Date().toISOString().split("T")[0],
  id_veterinario: "",
  motivo_consulta: "",
  diagnostico: "",
  observaciones: "",
};

const FORM_TRATAMIENTO_INICIAL = {
  id_atencion: "",
  descripcion: "",
  medicamento: "",
  dosis: "",
  duracion: "",
  indicaciones: "",
};

function DetalleMascota() {
  const { id } = useParams();
  const { setLabel, clearLabel } = useBreadcrumb();

  const [mascota, setMascota] = useState(null);
  const [atenciones, setAtenciones] = useState([]);
  const [tratamientos, setTratamientos] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [modalAtencionAbierto, setModalAtencionAbierto] = useState(false);
  const [formAtencion, setFormAtencion] = useState(FORM_ATENCION_INICIAL);
  const [guardandoAtencion, setGuardandoAtencion] = useState(false);
  const [errorAtencion, setErrorAtencion] = useState("");

  const [modalTratamientoAbierto, setModalTratamientoAbierto] =
    useState(false);
  const [formTratamiento, setFormTratamiento] = useState(
    FORM_TRATAMIENTO_INICIAL
  );
  const [tratamientoEditando, setTratamientoEditando] = useState(null);
  const [guardandoTratamiento, setGuardandoTratamiento] = useState(false);
  const [errorTratamiento, setErrorTratamiento] = useState("");

  useEffect(() => {
    cargarInformacion();

    return () => clearLabel(`mascota-${id}`);
  }, [id]);

  async function cargarInformacion() {
    setCargando(true);

    await Promise.all([
      cargarMascota(),
      cargarAtenciones(),
      cargarTratamientos(),
      cargarVeterinarios(),
    ]);

    setCargando(false);
  }

  async function cargarMascota() {
    const { data, error } = await supabase
      .from("tb_mascota")
      .select(`
        *,
        tb_duenio(nombre, dni, telefono, direccion)
      `)
      .eq("id_mascota", id)
      .single();

    if (!error && data) {
      setMascota(data);
      setLabel(`mascota-${id}`, data.nombre);
    } else {
      console.error("Error cargando mascota:", error);
    }
  }

  async function cargarVeterinarios() {
    const { data, error } = await supabase
      .from("tb_veterinario")
      .select("id_veterinario, nombre, especialidad")
      .order("nombre", { ascending: true });

    if (!error) {
      setVeterinarios(data || []);
    } else {
      console.error("Error cargando veterinarios:", error);
    }
  }

  async function cargarAtenciones() {
    const { data, error } = await supabase
      .from("tb_atencion")
      .select(`
        *,
        tb_veterinario(nombre)
      `)
      .eq("id_mascota", id)
      .order("fecha", { ascending: false });

    if (!error) {
      setAtenciones(
        (data || []).map((atencion) => ({
          ...atencion,
          veterinario: atencion.tb_veterinario?.nombre || "Sin veterinario",
        }))
      );
    } else {
      console.error("Error cargando atenciones:", error);
    }
  }

  async function cargarTratamientos() {
    const { data: atencionesData, error: errorAtenciones } = await supabase
      .from("tb_atencion")
      .select("id_atencion")
      .eq("id_mascota", id);

    if (errorAtenciones || !atencionesData?.length) {
      setTratamientos([]);
      return;
    }

    const idsAtenciones = atencionesData.map(
      (atencion) => atencion.id_atencion
    );

    const { data, error } = await supabase
      .from("tb_detalle_tratamiento")
      .select(`
        id_detalle,
        id_atencion,
        indicaciones,
        tb_tratamiento(*)
      `)
      .in("id_atencion", idsAtenciones);

    if (!error) {
      const tratamientosFormateados = (data || [])
        .filter((detalle) => detalle.tb_tratamiento)
        .map((detalle) => ({
          ...detalle.tb_tratamiento,
          id_detalle: detalle.id_detalle,
          id_atencion: detalle.id_atencion,
          indicaciones: detalle.indicaciones,
        }));

      setTratamientos(tratamientosFormateados);
    } else {
      console.error("Error cargando tratamientos:", error);
    }
  }

  function obtenerIconoMascota() {
    if (mascota?.especie?.toLowerCase().includes("gato")) {
      return "🐱";
    }

    return "🐶";
  }

  function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";

    return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function abrirModalAtencion() {
    setErrorAtencion("");

    setFormAtencion({
      ...FORM_ATENCION_INICIAL,
      fecha: new Date().toISOString().split("T")[0],
    });

    setModalAtencionAbierto(true);
  }

  function cerrarModalAtencion() {
    if (guardandoAtencion) return;

    setModalAtencionAbierto(false);
    setErrorAtencion("");
  }

  function actualizarCampoAtencion(e) {
    const { name, value } = e.target;

    setFormAtencion((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  async function guardarAtencion(e) {
    e.preventDefault();
    setErrorAtencion("");

    if (!formAtencion.id_veterinario) {
      setErrorAtencion("Selecciona al veterinario responsable.");
      return;
    }

    if (!formAtencion.motivo_consulta.trim()) {
      setErrorAtencion("Ingresa el motivo de atención.");
      return;
    }

    setGuardandoAtencion(true);

    const { error } = await supabase.from("tb_atencion").insert({
      id_mascota: Number(id),
      id_veterinario: Number(formAtencion.id_veterinario),
      fecha: formAtencion.fecha,
      motivo_consulta: formAtencion.motivo_consulta.trim(),
      motivo: formAtencion.motivo_consulta.trim(),
      diagnostico: formAtencion.diagnostico.trim() || null,
      observaciones: formAtencion.observaciones.trim() || null,
    });

    if (error) {
      console.error("Error registrando atención:", error);

      setErrorAtencion(
        "No se pudo registrar la atención. Revisa los datos e inténtalo nuevamente."
      );

      setGuardandoAtencion(false);
      return;
    }

    await Promise.all([cargarAtenciones(), cargarTratamientos()]);

    setModalAtencionAbierto(false);
    setGuardandoAtencion(false);
  }

  function abrirModalTratamiento(tratamiento = null) {
    setErrorTratamiento("");
    setTratamientoEditando(tratamiento);

    if (tratamiento) {
      setFormTratamiento({
        id_atencion: String(tratamiento.id_atencion || ""),
        descripcion: tratamiento.descripcion || "",
        medicamento: tratamiento.medicamento || "",
        dosis: tratamiento.dosis || "",
        duracion: tratamiento.duracion || "",
        indicaciones: tratamiento.indicaciones || "",
      });
    } else {
      setFormTratamiento({
        ...FORM_TRATAMIENTO_INICIAL,
        id_atencion: atenciones[0]?.id_atencion
          ? String(atenciones[0].id_atencion)
          : "",
      });
    }

    setModalTratamientoAbierto(true);
  }

  function cerrarModalTratamiento() {
    if (guardandoTratamiento) return;

    setModalTratamientoAbierto(false);
    setTratamientoEditando(null);
    setFormTratamiento(FORM_TRATAMIENTO_INICIAL);
    setErrorTratamiento("");
  }

  function actualizarCampoTratamiento(e) {
    const { name, value } = e.target;

    setFormTratamiento((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  async function guardarTratamiento(e) {
    e.preventDefault();
    setErrorTratamiento("");

    if (!formTratamiento.id_atencion) {
      setErrorTratamiento(
        "Selecciona la atención clínica a la que pertenece este tratamiento."
      );
      return;
    }

    if (!formTratamiento.descripcion.trim()) {
      setErrorTratamiento("Ingresa una descripción del tratamiento.");
      return;
    }

    if (!formTratamiento.medicamento.trim()) {
      setErrorTratamiento("Ingresa el medicamento.");
      return;
    }

    if (!formTratamiento.dosis.trim()) {
      setErrorTratamiento("Ingresa la dosis indicada.");
      return;
    }

    if (!formTratamiento.duracion.trim()) {
      setErrorTratamiento("Ingresa la duración del tratamiento.");
      return;
    }

    setGuardandoTratamiento(true);

    const datosTratamiento = {
      descripcion: formTratamiento.descripcion.trim(),
      medicamento: formTratamiento.medicamento.trim(),
      dosis: formTratamiento.dosis.trim(),
      duracion: formTratamiento.duracion.trim(),
    };

    try {
      if (tratamientoEditando) {
        const { error: errorActualizarTratamiento } = await supabase
          .from("tb_tratamiento")
          .update(datosTratamiento)
          .eq("id_tratamiento", tratamientoEditando.id_tratamiento);

        if (errorActualizarTratamiento) {
          throw new Error(
            `No se pudo actualizar el tratamiento: ${errorActualizarTratamiento.message}`
          );
        }

        const { error: errorActualizarDetalle } = await supabase
          .from("tb_detalle_tratamiento")
          .update({
            id_atencion: Number(formTratamiento.id_atencion),
            indicaciones: formTratamiento.indicaciones.trim() || null,
          })
          .eq("id_detalle", tratamientoEditando.id_detalle);

        if (errorActualizarDetalle) {
          throw new Error(
            `No se pudo actualizar la relación del tratamiento: ${errorActualizarDetalle.message}`
          );
        }
      } else {
        const { data: tratamientoCreado, error: errorTratamientoNuevo } =
          await supabase
            .from("tb_tratamiento")
            .insert(datosTratamiento)
            .select("id_tratamiento")
            .single();

        if (errorTratamientoNuevo || !tratamientoCreado) {
          throw new Error("No se pudo crear el tratamiento.");
        }

        const { error: errorDetalle } = await supabase
          .from("tb_detalle_tratamiento")
          .insert({
            id_atencion: Number(formTratamiento.id_atencion),
            id_tratamiento: tratamientoCreado.id_tratamiento,
            indicaciones: formTratamiento.indicaciones.trim() || null,
          });

        if (errorDetalle) {
          await supabase
            .from("tb_tratamiento")
            .delete()
            .eq("id_tratamiento", tratamientoCreado.id_tratamiento);

          throw new Error(
            "No se pudo vincular el tratamiento con la atención seleccionada."
          );
        }
      }

      await cargarTratamientos();
      cerrarModalTratamiento();
    } catch (err) {
      console.error("Error guardando tratamiento:", err);

      setErrorTratamiento(
        err.message || "No se pudo guardar el tratamiento."
      );
    } finally {
      setGuardandoTratamiento(false);
    }
  }

  async function eliminarTratamiento(tratamiento) {
    const confirmar = window.confirm(
      `¿Deseas eliminar el tratamiento "${tratamiento.descripcion}"?`
    );

    if (!confirmar) return;

    const { error: errorDetalle } = await supabase
      .from("tb_detalle_tratamiento")
      .delete()
      .eq("id_detalle", tratamiento.id_detalle);

    if (errorDetalle) {
      alert("No se pudo eliminar el vínculo del tratamiento.");
      return;
    }

    const { count } = await supabase
      .from("tb_detalle_tratamiento")
      .select("*", { count: "exact", head: true })
      .eq("id_tratamiento", tratamiento.id_tratamiento);

    if ((count || 0) === 0) {
      const { error: errorTratamiento } = await supabase
        .from("tb_tratamiento")
        .delete()
        .eq("id_tratamiento", tratamiento.id_tratamiento);

      if (errorTratamiento) {
        alert(
          "Se eliminó la relación, pero no se pudo eliminar el tratamiento."
        );
      }
    }

    await cargarTratamientos();
  }

  if (cargando || !mascota) {
    return (
      <div className="detalle-loading">
        <span>⏳</span>
        <p>Cargando ficha clínica...</p>
      </div>
    );
  }

  return (
    <div className="detalle-mascota-page">
      <section className="detalle-hero">
        <div className="detalle-hero__main">
          <div className="detalle-hero__avatar">{obtenerIconoMascota()}</div>

          <div>
            <span className="detalle-hero__tag">Ficha clínica veterinaria</span>

            <h1>{mascota.nombre}</h1>

            <p>
              {mascota.especie || "Sin especie"} ·{" "}
              {mascota.raza || "Sin raza registrada"}
            </p>
          </div>
        </div>

        <div className="detalle-hero__status">
          <span>Sexo</span>
          <strong>{mascota.sexo || "Sin registro"}</strong>
        </div>
      </section>

      <section className="detalle-resumen-grid">
        <article className="detalle-resumen-card">
          <span className="detalle-resumen-card__icon">🎂</span>
          <div>
            <small>Edad</small>
            <strong>{mascota.edad ?? "—"} años</strong>
          </div>
        </article>

        <article className="detalle-resumen-card">
          <span className="detalle-resumen-card__icon">⚖️</span>
          <div>
            <small>Peso</small>
            <strong>{mascota.peso ?? "—"} kg</strong>
          </div>
        </article>

        <article className="detalle-resumen-card">
          <span className="detalle-resumen-card__icon">🩺</span>
          <div>
            <small>Atenciones</small>
            <strong>{atenciones.length}</strong>
          </div>
        </article>

        <article className="detalle-resumen-card">
          <span className="detalle-resumen-card__icon">💊</span>
          <div>
            <small>Tratamientos</small>
            <strong>{tratamientos.length}</strong>
          </div>
        </article>
      </section>

      <section className="detalle-content-grid">
        <aside className="detalle-owner-card">
          <div className="detalle-section-title">
            <span>👤</span>

            <div>
              <h3>Propietario</h3>
              <p>Datos de contacto registrados.</p>
            </div>
          </div>

          <div className="detalle-owner-data">
            <div>
              <span>Nombre</span>
              <strong>{mascota.tb_duenio?.nombre || "Sin registro"}</strong>
            </div>

            <div>
              <span>DNI</span>
              <strong>{mascota.tb_duenio?.dni || "Sin registro"}</strong>
            </div>

            <div>
              <span>Teléfono</span>
              <strong>{mascota.tb_duenio?.telefono || "Sin registro"}</strong>
            </div>

            <div>
              <span>Dirección</span>
              <strong>{mascota.tb_duenio?.direccion || "Sin registro"}</strong>
            </div>
          </div>
        </aside>

        <main className="detalle-main-content">
          <section className="detalle-section-card">
            <div className="detalle-section-header detalle-section-header--action">
              <div>
                <span className="section-tag">Historia médica</span>
                <h2>Historial clínico</h2>
                <p>Atenciones y diagnósticos registrados para este paciente.</p>
              </div>

              <button
                className="detalle-new-attention-button"
                type="button"
                onClick={abrirModalAtencion}
              >
                <span>＋</span>
                Nueva atención
              </button>
            </div>

            {atenciones.length === 0 ? (
              <div className="detalle-empty-state">
                <span>📭</span>
                <h3>Sin atenciones registradas</h3>
                <p>Registra la primera atención clínica de esta mascota.</p>

                <button
                  className="detalle-empty-state__button"
                  type="button"
                  onClick={abrirModalAtencion}
                >
                  Registrar atención
                </button>
              </div>
            ) : (
              <div className="historial-clinico-list">
                {atenciones.map((atencion, index) => (
                  <article
                    key={atencion.id_atencion}
                    className="historial-clinico-item"
                  >
                    <div className="historial-clinico-item__timeline">
                      <div className="historial-clinico-item__dot">
                        {index + 1}
                      </div>

                      {index !== atenciones.length - 1 && (
                        <div className="historial-clinico-item__line" />
                      )}
                    </div>

                    <div className="historial-clinico-item__content">
                      <div className="historial-clinico-item__header">
                        <div>
                          <h3>
                            {atencion.motivo_consulta ||
                              atencion.motivo ||
                              "Atención clínica"}
                          </h3>

                          <p className="historial-clinico-item__date">
                            {formatearFecha(atencion.fecha)}
                          </p>
                        </div>

                        <span
                          className={`historial-clinico-item__status ${
                            atencion.diagnostico ? "completado" : "pendiente"
                          }`}
                        >
                          {atencion.diagnostico
                            ? "Registrado"
                            : "En proceso"}
                        </span>
                      </div>

                      <div className="historial-clinico-item__meta">
                        <span>
                          <strong>Veterinario:</strong>{" "}
                          {atencion.veterinario || "Sin asignar"}
                        </span>

                        <span>
                          <strong>Mascota:</strong> {mascota.nombre}
                        </span>
                      </div>

                      <div className="historial-clinico-item__body">
                        <div className="historial-clinico-item__block">
                          <span className="historial-clinico-item__label">
                            Diagnóstico
                          </span>

                          <p>
                            {atencion.diagnostico ||
                              "Aún no se registró diagnóstico."}
                          </p>
                        </div>

                        <div className="historial-clinico-item__block">
                          <span className="historial-clinico-item__label">
                            Observaciones
                          </span>

                          <p>
                            {atencion.observaciones ||
                              "Sin observaciones adicionales registradas."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="detalle-section-card">
            <div className="detalle-section-header detalle-section-header--action">
              <div>
                <span className="section-tag">Plan terapéutico</span>
                <h2>Tratamientos</h2>
                <p>Medicamentos, dosis e indicaciones prescritas.</p>
              </div>

              <button
                className="detalle-new-treatment-button"
                type="button"
                onClick={() => abrirModalTratamiento()}
                disabled={atenciones.length === 0}
                title={
                  atenciones.length === 0
                    ? "Primero registra una atención clínica"
                    : "Registrar tratamiento"
                }
              >
                <span>＋</span>
                Nuevo tratamiento
              </button>
            </div>

            {atenciones.length === 0 ? (
              <div className="detalle-empty-state">
                <span>🩺</span>
                <h3>Primero registra una atención</h3>
                <p>
                  Los tratamientos deben estar vinculados a una atención
                  clínica existente.
                </p>
              </div>
            ) : tratamientos.length === 0 ? (
              <div className="detalle-empty-state">
                <span>💊</span>
                <h3>Sin tratamientos registrados</h3>
                <p>
                  Registra un medicamento, dosis e indicaciones para este
                  paciente.
                </p>

                <button
                  className="detalle-empty-state__button"
                  type="button"
                  onClick={() => abrirModalTratamiento()}
                >
                  Registrar tratamiento
                </button>
              </div>
            ) : (
              <div className="detalle-tratamientos-list">
                {tratamientos.map((tratamiento, index) => {
                  const atencionRelacionada = atenciones.find(
                    (atencion) =>
                      Number(atencion.id_atencion) ===
                      Number(tratamiento.id_atencion)
                  );

                  return (
                    <article
                      key={`${
                        tratamiento.id_detalle || tratamiento.id_tratamiento
                      }-${index}`}
                      className="detalle-tratamiento-card"
                    >
                      <div className="detalle-tratamiento-card__icon">💊</div>

                      <div className="detalle-tratamiento-card__content">
                        <div className="detalle-tratamiento-card__header">
                          <div>
                            <h3>
                              {tratamiento.descripcion ||
                                "Tratamiento veterinario"}
                            </h3>

                            {atencionRelacionada && (
                              <p>
                                Atención:{" "}
                                {atencionRelacionada.motivo_consulta ||
                                  atencionRelacionada.motivo ||
                                  "Consulta clínica"}
                              </p>
                            )}
                          </div>

                          {atencionRelacionada && (
                            <span className="detalle-treatment-date">
                              {formatearFecha(atencionRelacionada.fecha)}
                            </span>
                          )}
                        </div>

                        <div className="detalle-tratamiento-card__grid">
                          <div>
                            <span>Medicamento</span>
                            <strong>
                              {tratamiento.medicamento || "No registrado"}
                            </strong>
                          </div>

                          <div>
                            <span>Dosis</span>
                            <strong>
                              {tratamiento.dosis || "No registrada"}
                            </strong>
                          </div>

                          <div>
                            <span>Duración</span>
                            <strong>
                              {tratamiento.duracion || "No registrada"}
                            </strong>
                          </div>
                        </div>

                        {tratamiento.indicaciones && (
                          <div className="detalle-tratamiento-card__notes">
                            <span>Indicaciones</span>
                            <p>{tratamiento.indicaciones}</p>
                          </div>
                        )}

                        <div className="detalle-treatment-actions">
                          <button
                            className="detalle-treatment-edit-button"
                            type="button"
                            onClick={() => abrirModalTratamiento(tratamiento)}
                          >
                            Editar tratamiento
                          </button>

                          <button
                            className="detalle-treatment-delete-button"
                            type="button"
                            onClick={() => eliminarTratamiento(tratamiento)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </section>

      {modalAtencionAbierto && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              cerrarModalAtencion();
            }
          }}
        >
          <form
            className="modal-content detalle-attention-modal"
            onSubmit={guardarAtencion}
          >
            <div className="detalle-attention-modal__header">
              <div>
                <span className="section-tag">Nueva atención</span>
                <h2>Registrar atención clínica</h2>
                <p>
                  Paciente: <strong>{mascota.nombre}</strong>
                </p>
              </div>

              <button
                className="detalle-modal-close"
                type="button"
                onClick={cerrarModalAtencion}
                aria-label="Cerrar formulario"
              >
                ×
              </button>
            </div>

            {errorAtencion && (
              <div className="detalle-form-error">{errorAtencion}</div>
            )}

            <div className="detalle-attention-form-grid">
              <label>
                Fecha de atención
                <input
                  type="date"
                  name="fecha"
                  value={formAtencion.fecha}
                  onChange={actualizarCampoAtencion}
                  required
                />
              </label>

              <label>
                Veterinario responsable
                <select
                  name="id_veterinario"
                  value={formAtencion.id_veterinario}
                  onChange={actualizarCampoAtencion}
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

            <label className="detalle-attention-form-full">
              Motivo de atención
              <input
                type="text"
                name="motivo_consulta"
                value={formAtencion.motivo_consulta}
                onChange={actualizarCampoAtencion}
                placeholder="Ejemplo: Control general, vacunación, malestar..."
                required
              />
            </label>

            <label className="detalle-attention-form-full">
              Diagnóstico
              <textarea
                name="diagnostico"
                value={formAtencion.diagnostico}
                onChange={actualizarCampoAtencion}
                placeholder="Describe el diagnóstico, de ser necesario."
                rows="4"
              />
            </label>

            <label className="detalle-attention-form-full">
              Observaciones
              <textarea
                name="observaciones"
                value={formAtencion.observaciones}
                onChange={actualizarCampoAtencion}
                placeholder="Indicaciones, evolución, recomendaciones u observaciones."
                rows="4"
              />
            </label>

            <div className="modal-actions detalle-attention-modal__actions">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={cerrarModalAtencion}
                disabled={guardandoAtencion}
              >
                Cancelar
              </button>

              <button
                className="detalle-save-attention-button"
                type="submit"
                disabled={guardandoAtencion}
              >
                {guardandoAtencion
                  ? "Guardando atención..."
                  : "Guardar atención"}
              </button>
            </div>
          </form>
        </div>
      )}

      {modalTratamientoAbierto && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              cerrarModalTratamiento();
            }
          }}
        >
          <form
            className="modal-content detalle-treatment-modal"
            onSubmit={guardarTratamiento}
          >
            <div className="detalle-attention-modal__header">
              <div>
                <span className="section-tag">Plan terapéutico</span>

                <h2>
                  {tratamientoEditando
                    ? "Editar tratamiento"
                    : "Registrar tratamiento"}
                </h2>

                <p>
                  Paciente: <strong>{mascota.nombre}</strong>
                </p>
              </div>

              <button
                className="detalle-modal-close"
                type="button"
                onClick={cerrarModalTratamiento}
                aria-label="Cerrar formulario"
              >
                ×
              </button>
            </div>

            {errorTratamiento && (
              <div className="detalle-form-error">{errorTratamiento}</div>
            )}

            <label className="detalle-attention-form-full">
              Atención clínica relacionada
              <select
                name="id_atencion"
                value={formTratamiento.id_atencion}
                onChange={actualizarCampoTratamiento}
                required
              >
                <option value="">Selecciona una atención</option>

                {atenciones.map((atencion) => (
                  <option
                    key={atencion.id_atencion}
                    value={atencion.id_atencion}
                  >
                    {formatearFecha(atencion.fecha)} —{" "}
                    {atencion.motivo_consulta ||
                      atencion.motivo ||
                      "Atención clínica"}
                  </option>
                ))}
              </select>
            </label>

            <label className="detalle-attention-form-full">
              Descripción del tratamiento
              <input
                type="text"
                name="descripcion"
                value={formTratamiento.descripcion}
                onChange={actualizarCampoTratamiento}
                placeholder="Ejemplo: Tratamiento antiinflamatorio"
                required
              />
            </label>

            <div className="detalle-attention-form-grid">
              <label>
                Medicamento
                <input
                  type="text"
                  name="medicamento"
                  value={formTratamiento.medicamento}
                  onChange={actualizarCampoTratamiento}
                  placeholder="Ejemplo: Meloxicam"
                  required
                />
              </label>

              <label>
                Dosis
                <input
                  type="text"
                  name="dosis"
                  value={formTratamiento.dosis}
                  onChange={actualizarCampoTratamiento}
                  placeholder="Ejemplo: 1 tableta diaria"
                  required
                />
              </label>
            </div>

            <label className="detalle-attention-form-full">
              Duración
              <input
                type="text"
                name="duracion"
                value={formTratamiento.duracion}
                onChange={actualizarCampoTratamiento}
                placeholder="Ejemplo: 5 días"
                required
              />
            </label>

            <label className="detalle-attention-form-full">
              Indicaciones
              <textarea
                name="indicaciones"
                value={formTratamiento.indicaciones}
                onChange={actualizarCampoTratamiento}
                placeholder="Ejemplo: Administrar con alimentos y evitar esfuerzo físico."
                rows="4"
              />
            </label>

            <div className="modal-actions detalle-attention-modal__actions">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={cerrarModalTratamiento}
                disabled={guardandoTratamiento}
              >
                Cancelar
              </button>

              <button
                className="detalle-save-treatment-button"
                type="submit"
                disabled={guardandoTratamiento}
              >
                {guardandoTratamiento
                  ? "Guardando..."
                  : tratamientoEditando
                  ? "Guardar cambios"
                  : "Guardar tratamiento"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default DetalleMascota;