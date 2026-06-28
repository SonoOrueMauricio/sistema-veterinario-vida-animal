import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useBreadcrumb } from "../context/BreadcrumbContext";
import CardAtencion from "../Components/CardAtencion";

function DetalleMascota() {
  const { id } = useParams();
  const { setLabel, clearLabel } = useBreadcrumb();

  const [mascota, setMascota] = useState(null);
  const [atenciones, setAtenciones] = useState([]);
  const [tratamientos, setTratamientos] = useState([]);

  useEffect(() => {
    cargarMascota();
    cargarAtenciones();
    cargarTratamientos();

    return () => clearLabel(`mascota-${id}`);
  }, [id]);

  /** Carga datos de la mascota y su dueño; actualiza breadcrumb con el nombre */
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
      console.error(error);
    }
  }

  /** Historial de atenciones clínicas de la mascota */
  async function cargarAtenciones() {
    const { data, error } = await supabase
      .from("tb_atencion")
      .select(`*, tb_veterinario(nombre)`)
      .eq("id_mascota", id)
      .order("fecha", { ascending: false });

    if (!error) {
      setAtenciones(
        data.map((a) => ({
          ...a,
          veterinario: a.tb_veterinario?.nombre,
        }))
      );
    }
  }

  /** Tratamientos asociados a las atenciones de la mascota */
  async function cargarTratamientos() {
    const { data: atencionesData } = await supabase
      .from("tb_atencion")
      .select("id_atencion")
      .eq("id_mascota", id);

    if (!atencionesData?.length) {
      setTratamientos([]);
      return;
    }

    const ids = atencionesData.map((a) => a.id_atencion);

    const { data, error } = await supabase
      .from("tb_detalle_tratamiento")
      .select(`*, tb_tratamiento(*)`)
      .in("id_atencion", ids);

    if (!error) {
      setTratamientos(data.map((t) => t.tb_tratamiento).filter(Boolean));
    }
  }

  if (!mascota) return <p className="loading-text">Cargando...</p>;

  return (
    <div className="detail-grid">
      <aside className="menu-panel">
        <div className="panel-title">Secciones</div>
        <ul className="section-list">
          <li className="section-item active">General</li>
          <li className="section-item">Historial clínico</li>
          <li className="section-item">Tratamientos</li>
        </ul>
      </aside>

      <section className="patient-panel">
        <div className="patient-summary">
          <div className="patient-avatar">
            <div className="avatar-placeholder">{mascota.nombre?.charAt(0)}</div>
          </div>

          <div className="patient-info">
            <div className="patient-header-row">
              <div>
                <h2>{mascota.nombre}</h2>
                <p className="subtitle">
                  {mascota.especie} · {mascota.raza}
                </p>
              </div>
              <span className="badge">{mascota.sexo}</span>
            </div>

            <div className="patient-info-grid">
              <div className="patient-data">
                <span><strong>Edad:</strong> {mascota.edad}</span>
                <span><strong>Peso:</strong> {mascota.peso} kg</span>
                <span><strong>Sexo:</strong> {mascota.sexo}</span>
              </div>

              {/* Datos del dueño siempre visibles en el detalle */}
              <div className="patient-data owner-data">
                <h4 className="owner-title">Datos del dueño</h4>
                <span><strong>Nombre:</strong> {mascota.tb_duenio?.nombre}</span>
                <span><strong>DNI:</strong> {mascota.tb_duenio?.dni}</span>
                <span><strong>Teléfono:</strong> {mascota.tb_duenio?.telefono}</span>
                <span><strong>Dirección:</strong> {mascota.tb_duenio?.direccion}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="section-block">
          <h3>Historial clínico</h3>
          {atenciones.length === 0 ? (
            <p className="empty-message">Sin atenciones registradas</p>
          ) : (
            atenciones.map((a) => <CardAtencion key={a.id_atencion} atencion={a} />)
          )}
        </div>

        <div className="section-block">
          <h3>Tratamientos</h3>
          {tratamientos.length === 0 ? (
            <p className="empty-message">Sin tratamientos registrados</p>
          ) : (
            tratamientos.map((t, i) => (
              <div key={i} className="treatment-card">
                <h4>{t.descripcion}</h4>
                <span><strong>Medicamento:</strong> {t.medicamento}</span>
                <span><strong>Dosis:</strong> {t.dosis}</span>
                <span><strong>Duración:</strong> {t.duracion}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default DetalleMascota;
