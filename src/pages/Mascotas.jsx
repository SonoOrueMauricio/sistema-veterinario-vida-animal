import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import CardMascota from "../Components/CardMascota";

const FORM_INICIAL = {
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
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarMascotas();
  }, []);

  /** Carga el listado de mascotas con datos del dueño desde Supabase */
  async function cargarMascotas() {
    const { data, error: err } = await supabase
      .from("tb_mascota")
      .select(`
        id_mascota,
        nombre,
        especie,
        raza,
        edad,
        peso,
        sexo,
        tb_duenio(nombre)
      `);

    if (!err) {
      setMascotas(
        data.map((m) => ({
          ...m,
          duenio: m.tb_duenio?.nombre,
        }))
      );
    } else {
      console.error("Error cargando mascotas:", err);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  /**
   * Flujo real veterinario:
   * 1. Crear dueño en tb_duenio
   * 2. Obtener id_duenio
   * 3. Crear mascota en tb_mascota
   */
  async function guardarMascota() {
    setError("");
    setGuardando(true);

    const { data: duenio, error: errDuenio } = await supabase
      .from("tb_duenio")
      .insert([
        {
          nombre: form.duenio_nombre,
          dni: form.duenio_dni,
          telefono: form.duenio_telefono,
          direccion: form.duenio_direccion,
        },
      ])
      .select("id_duenio")
      .single();

    if (errDuenio) {
      setError("No se pudo registrar al dueño: " + errDuenio.message);
      setGuardando(false);
      return;
    }

    const { error: errMascota } = await supabase.from("tb_mascota").insert([
      {
        id_duenio: duenio.id_duenio,
        nombre: form.nombre,
        especie: form.especie,
        raza: form.raza,
        edad: form.edad,
        sexo: form.sexo,
        peso: form.peso,
      },
    ]);

    setGuardando(false);

    if (!errMascota) {
      setMostrarModal(false);
      setForm(FORM_INICIAL);
      cargarMascotas();
    } else {
      setError("No se pudo registrar la mascota: " + errMascota.message);
    }
  }

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1>Mascotas</h1>
          <p className="subtitle">Ficha clínica de los pacientes registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setMostrarModal(true)}>
          + Nueva Mascota
        </button>
      </div>

      <div className="grid cards-grid">
        {mascotas.length === 0 ? (
          <p className="empty-message">No hay mascotas registradas</p>
        ) : (
          mascotas.map((mascota) => (
            <CardMascota key={mascota.id_mascota} mascota={mascota} />
          ))
        )}
      </div>

      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Registrar mascota y dueño</h2>
            <p className="subtitle">Complete los datos del propietario y del paciente</p>

            <div className="form-section">
              <h3 className="form-section-title">Datos del dueño</h3>
              <div className="form-grid">
                <input name="duenio_nombre" placeholder="Nombre completo" value={form.duenio_nombre} onChange={handleChange} />
                <input name="duenio_dni" placeholder="DNI" value={form.duenio_dni} onChange={handleChange} />
                <input name="duenio_telefono" placeholder="Teléfono" value={form.duenio_telefono} onChange={handleChange} />
                <input name="duenio_direccion" placeholder="Dirección" value={form.duenio_direccion} onChange={handleChange} />
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Datos de la mascota</h3>
              <div className="form-grid">
                <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} />
                <input name="especie" placeholder="Especie" value={form.especie} onChange={handleChange} />
                <input name="raza" placeholder="Raza" value={form.raza} onChange={handleChange} />
                <input name="edad" placeholder="Edad" value={form.edad} onChange={handleChange} />
                <select name="sexo" value={form.sexo} onChange={handleChange}>
                  <option value="">Sexo</option>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
                <input name="peso" placeholder="Peso (kg)" value={form.peso} onChange={handleChange} />
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={guardarMascota} disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar"}
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

export default Mascotas;
