import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabaseClient";
import CardMascota from "../Components/CardMascota";
import "../styles/mascotas.css";

const FORM_INICIAL = {
  id_mascota: "",
  id_duenio: "",
  duenio_nombre: "",
  duenio_dni: "",
  duenio_telefono: "",
  duenio_direccion: "",
  nombre: "",
  especie: "",
  raza: "",
  edad: "",
  sexo: "",
  peso: "",
};

function Mascotas() {
  const [mascotas, setMascotas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mascotaEditando, setMascotaEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEspecie, setFiltroEspecie] = useState("Todas");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarMascotas();
  }, []);

  async function cargarMascotas() {
    setCargando(true);

    const { data, error: err } = await supabase
      .from("tb_mascota")
      .select(`
        id_mascota,
        id_duenio,
        nombre,
        especie,
        raza,
        edad,
        peso,
        sexo,
        tb_duenio(
          id_duenio,
          nombre,
          dni,
          telefono,
          direccion
        )
      `)
      .order("id_mascota", { ascending: false });

    if (!err) {
      setMascotas(
        (data || []).map((mascota) => ({
          ...mascota,
          duenio: mascota.tb_duenio?.nombre || "Sin propietario",
          duenio_dni: mascota.tb_duenio?.dni || "",
          duenio_telefono: mascota.tb_duenio?.telefono || "",
          duenio_direccion: mascota.tb_duenio?.direccion || "",
        }))
      );
    } else {
      console.error("Error cargando mascotas:", err);
    }

    setCargando(false);
  }

  function abrirModalNuevaMascota() {
    setMascotaEditando(null);
    setForm(FORM_INICIAL);
    setError("");
    setMostrarModal(true);
  }

  function abrirModalEditar(mascota) {
    setMascotaEditando(mascota);

    setForm({
      id_mascota: mascota.id_mascota,
      id_duenio: mascota.id_duenio || mascota.tb_duenio?.id_duenio || "",
      duenio_nombre: mascota.duenio || "",
      duenio_dni: mascota.duenio_dni || "",
      duenio_telefono: mascota.duenio_telefono || "",
      duenio_direccion: mascota.duenio_direccion || "",
      nombre: mascota.nombre || "",
      especie: mascota.especie || "",
      raza: mascota.raza || "",
      edad: mascota.edad ?? "",
      sexo: mascota.sexo || "",
      peso: mascota.peso ?? "",
    });

    setError("");
    setMostrarModal(true);
  }

  function cerrarModal() {
    if (guardando) return;

    setMostrarModal(false);
    setMascotaEditando(null);
    setForm(FORM_INICIAL);
    setError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  const especies = useMemo(() => {
    const listaEspecies = mascotas
      .map((mascota) => mascota.especie)
      .filter(Boolean);

    return ["Todas", ...new Set(listaEspecies)];
  }, [mascotas]);

  const mascotasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return mascotas.filter((mascota) => {
      const coincideEspecie =
        filtroEspecie === "Todas" || mascota.especie === filtroEspecie;

      const contenido = [
        mascota.nombre,
        mascota.especie,
        mascota.raza,
        mascota.duenio,
      ]
        .join(" ")
        .toLowerCase();

      return coincideEspecie && (!texto || contenido.includes(texto));
    });
  }, [mascotas, busqueda, filtroEspecie]);

  async function guardarMascota(e) {
    e.preventDefault();
    setError("");

    if (
      !form.duenio_nombre.trim() ||
      !form.duenio_dni.trim() ||
      !form.nombre.trim() ||
      !form.especie.trim()
    ) {
      setError(
        "Completa el nombre y DNI del propietario, además del nombre y especie de la mascota."
      );
      return;
    }

    if (form.duenio_dni.trim().length !== 8) {
      setError("El DNI del propietario debe tener 8 dígitos.");
      return;
    }

    setGuardando(true);

    try {
      let idDuenio = form.id_duenio;

      if (mascotaEditando) {
        const { error: errorActualizarDuenio } = await supabase
          .from("tb_duenio")
          .update({
            nombre: form.duenio_nombre.trim(),
            dni: form.duenio_dni.trim(),
            telefono: form.duenio_telefono.trim() || null,
            direccion: form.duenio_direccion.trim() || null,
          })
          .eq("id_duenio", Number(idDuenio));

        if (errorActualizarDuenio) {
          throw new Error(
            `No se pudo actualizar el propietario: ${errorActualizarDuenio.message}`
          );
        }

        const { error: errorActualizarMascota } = await supabase
          .from("tb_mascota")
          .update({
            nombre: form.nombre.trim(),
            especie: form.especie.trim(),
            raza: form.raza.trim() || null,
            edad: form.edad ? Number(form.edad) : null,
            sexo: form.sexo || null,
            peso: form.peso ? Number(form.peso) : null,
          })
          .eq("id_mascota", Number(form.id_mascota));

        if (errorActualizarMascota) {
          throw new Error(
            `No se pudo actualizar la mascota: ${errorActualizarMascota.message}`
          );
        }
      } else {
        const { data: duenioExistente, error: errorBuscarDuenio } =
          await supabase
            .from("tb_duenio")
            .select("id_duenio")
            .eq("dni", form.duenio_dni.trim())
            .maybeSingle();

        if (errorBuscarDuenio) {
          throw new Error("No se pudo verificar la información del propietario.");
        }

        idDuenio = duenioExistente?.id_duenio;

        if (!idDuenio) {
          const { data: nuevoDuenio, error: errorNuevoDuenio } =
            await supabase
              .from("tb_duenio")
              .insert({
                nombre: form.duenio_nombre.trim(),
                dni: form.duenio_dni.trim(),
                telefono: form.duenio_telefono.trim() || null,
                direccion: form.duenio_direccion.trim() || null,
              })
              .select("id_duenio")
              .single();

          if (errorNuevoDuenio) {
            throw new Error(
              `No se pudo registrar el propietario: ${errorNuevoDuenio.message}`
            );
          }

          idDuenio = nuevoDuenio.id_duenio;
        }

        const { error: errorNuevaMascota } = await supabase
          .from("tb_mascota")
          .insert({
            id_duenio: Number(idDuenio),
            nombre: form.nombre.trim(),
            especie: form.especie.trim(),
            raza: form.raza.trim() || null,
            edad: form.edad ? Number(form.edad) : null,
            sexo: form.sexo || null,
            peso: form.peso ? Number(form.peso) : null,
          });

        if (errorNuevaMascota) {
          throw new Error(
            `No se pudo registrar la mascota: ${errorNuevaMascota.message}`
          );
        }
      }

      cerrarModal();
      await cargarMascotas();
    } catch (err) {
      setError(err.message || "Ocurrió un error al guardar la mascota.");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarMascota(mascota) {
    const confirmar = window.confirm(
      `¿Deseas eliminar a ${mascota.nombre}? Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    const { error: err } = await supabase
      .from("tb_mascota")
      .delete()
      .eq("id_mascota", mascota.id_mascota);

    if (err) {
      console.error("Error eliminando mascota:", err);

      alert(
        "No se pudo eliminar la mascota. Es posible que tenga atenciones o citas registradas."
      );

      return;
    }

    await cargarMascotas();
  }

  return (
    <div className="mascotas-page">
      <section className="mascotas-hero">
        <div>
          <span className="mascotas-hero__tag">Pacientes veterinarios</span>
          <h1>Gestión de mascotas</h1>
          <p>
            Consulta, registra y administra la información clínica de los
            pacientes de la veterinaria.
          </p>
        </div>

        <div className="mascotas-hero__summary">
          <span>Total de pacientes</span>
          <strong>{mascotas.length}</strong>
        </div>
      </section>

      <section className="mascotas-toolbar">
        <div className="mascotas-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Buscar por mascota, dueño, raza o especie..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="mascotas-toolbar__actions">
          <select
            value={filtroEspecie}
            onChange={(e) => setFiltroEspecie(e.target.value)}
            className="mascotas-filter"
          >
            {especies.map((especie) => (
              <option key={especie} value={especie}>
                {especie}
              </option>
            ))}
          </select>

          <button
            className="mascotas-new-button"
            type="button"
            onClick={abrirModalNuevaMascota}
          >
            <span>＋</span>
            Nueva mascota
          </button>
        </div>
      </section>

      <div className="mascotas-results-info">
        <span>
          {mascotasFiltradas.length}{" "}
          {mascotasFiltradas.length === 1
            ? "mascota encontrada"
            : "mascotas encontradas"}
        </span>
      </div>

      {cargando ? (
        <div className="mascotas-empty-state">
          <div className="mascotas-empty-state__icon">⏳</div>
          <h3>Cargando pacientes...</h3>
          <p>Estamos obteniendo la información registrada.</p>
        </div>
      ) : mascotasFiltradas.length === 0 ? (
        <div className="mascotas-empty-state">
          <div className="mascotas-empty-state__icon">🐾</div>
          <h3>No se encontraron mascotas</h3>
          <p>Registra un nuevo paciente o modifica los filtros de búsqueda.</p>

          <button
            className="mascotas-new-button"
            type="button"
            onClick={abrirModalNuevaMascota}
          >
            Registrar mascota
          </button>
        </div>
      ) : (
        <section className="grid cards-grid mascotas-cards-grid">
          {mascotasFiltradas.map((mascota) => (
            <CardMascota
              key={mascota.id_mascota}
              mascota={mascota}
              onEditar={abrirModalEditar}
              onEliminar={eliminarMascota}
            />
          ))}
        </section>
      )}

      {mostrarModal && (
        <div className="modal-overlay" onMouseDown={cerrarModal}>
          <form
            className="modal-content mascotas-modal"
            onSubmit={guardarMascota}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mascotas-modal__header">
              <div>
                <span className="section-tag">
                  {mascotaEditando ? "Editar registro" : "Nuevo registro"}
                </span>

                <h2>
                  {mascotaEditando ? "Editar mascota" : "Registrar mascota"}
                </h2>

                <p>
                  {mascotaEditando
                    ? "Actualiza la información del propietario y del paciente."
                    : "Completa la información del propietario y del paciente."}
                </p>
              </div>

              <button
                className="mascotas-modal__close"
                onClick={cerrarModal}
                type="button"
                aria-label="Cerrar modal"
              >
                ×
              </button>
            </div>

            <div className="form-section">
              <div className="form-section-heading">
                <span>👤</span>

                <div>
                  <h3 className="form-section-title">Datos del propietario</h3>
                  <p>Información para contacto y seguimiento.</p>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  Nombre completo *
                  <input
                    name="duenio_nombre"
                    value={form.duenio_nombre}
                    onChange={handleChange}
                    placeholder="Ejemplo: María López Torres"
                  />
                </label>

                <label>
                  DNI *
                  <input
                    name="duenio_dni"
                    value={form.duenio_dni}
                    onChange={handleChange}
                    placeholder="8 dígitos"
                    maxLength="8"
                  />
                </label>

                <label>
                  Teléfono
                  <input
                    name="duenio_telefono"
                    value={form.duenio_telefono}
                    onChange={handleChange}
                    placeholder="Ejemplo: 987654321"
                  />
                </label>

                <label>
                  Dirección
                  <input
                    name="duenio_direccion"
                    value={form.duenio_direccion}
                    onChange={handleChange}
                    placeholder="Dirección del propietario"
                  />
                </label>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-heading">
                <span>🐾</span>

                <div>
                  <h3 className="form-section-title">Datos de la mascota</h3>
                  <p>Información básica del paciente veterinario.</p>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  Nombre *
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ejemplo: Max"
                  />
                </label>

                <label>
                  Especie *
                  <input
                    name="especie"
                    value={form.especie}
                    onChange={handleChange}
                    placeholder="Ejemplo: Perro o Gato"
                  />
                </label>

                <label>
                  Raza
                  <input
                    name="raza"
                    value={form.raza}
                    onChange={handleChange}
                    placeholder="Ejemplo: Labrador"
                  />
                </label>

                <label>
                  Edad
                  <input
                    name="edad"
                    type="number"
                    min="0"
                    value={form.edad}
                    onChange={handleChange}
                    placeholder="Años"
                  />
                </label>

                <label>
                  Sexo
                  <select name="sexo" value={form.sexo} onChange={handleChange}>
                    <option value="">Seleccionar</option>
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                </label>

                <label>
                  Peso
                  <input
                    name="peso"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.peso}
                    onChange={handleChange}
                    placeholder="Peso en kg"
                  />
                </label>
              </div>
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
                className="mascotas-save-button"
                type="submit"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : mascotaEditando
                  ? "Guardar cambios"
                  : "Guardar mascota"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Mascotas;