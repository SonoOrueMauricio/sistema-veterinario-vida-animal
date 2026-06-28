import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import Calendario from "../Components/Calendario";

function Dashboard() {

  // KPI
  const [totalMascotas, setTotalMascotas] = useState(0);
  const [citasHoy, setCitasHoy] = useState(0);
  const [atenciones, setAtenciones] = useState(0);
  const [citasPendientes, setCitasPendientes] = useState(0);

  // ACTIVIDAD
  const [actividad, setActividad] = useState([]);

  // EVENTOS CALENDARIO
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    cargarKPIs();
    cargarActividad();
    cargarEventos();
  }, []);

  // -------------------------
  // KPIs
  // -------------------------
  async function cargarKPIs() {

    // Mascotas
    const { count: mascotasCount } = await supabase
      .from("tb_mascota")
      .select("*", { count: "exact", head: true });

    setTotalMascotas(mascotasCount || 0);

    // Hoy
    const hoy = new Date().toISOString().split("T")[0];

    // Citas hoy
    const { count: citasHoyCount } = await supabase
      .from("tb_cita")
      .select("*", { count: "exact", head: true })
      .eq("fecha", hoy);

    setCitasHoy(citasHoyCount || 0);

    // Atenciones
    const { count: atencionesCount } = await supabase
      .from("tb_atencion")
      .select("*", { count: "exact", head: true });

    setAtenciones(atencionesCount || 0);

    // Citas pendientes
    const { count: pendientesCount } = await supabase
      .from("tb_cita")
      .select("*", { count: "exact", head: true })
      .eq("estado", "Pendiente");

    setCitasPendientes(pendientesCount || 0);
  }

  // -------------------------
  // ACTIVIDAD RECIENTE
  // -------------------------
  async function cargarActividad() {
    const { data, error } = await supabase
      .from("tb_atencion")
      .select(`
        id_atencion,
        fecha,
        motivo_consulta,
        diagnostico,
        tb_mascota(nombre),
        tb_veterinario(nombre)
      `)
      .order("fecha", { ascending: false })
      .limit(5);

    if (!error) {
      setActividad(data);
    } else {
      console.error("Error actividad:", error);
    }
  }

  // -------------------------
  // EVENTOS PARA CALENDARIO
  // -------------------------
  async function cargarEventos() {
    const { data, error } = await supabase
      .from("tb_cita")
      .select(`
        id_cita,
        fecha,
        hora,
        estado,
        tb_mascota(nombre)
      `);

    if (!error) {
      const eventosFormateados = data.map((item) => ({       
        title: `${item.tb_mascota?.nombre}`,
          start: `${item.fecha}T${item.hora}`,
          color: item.estado === "Pendiente" ? "#f59e0b" : "#22c55e",
      }));


      setEventos(eventosFormateados);
    } else {
      console.error("Error eventos:", error);
    }
  }

  return (
    <div>

      <h1>Bienvenido al sistema</h1>
      <p>Resumen general de tu clínica veterinaria.</p>

      {/* KPI */}
      <div className="cards-container">

        <div className="card">
          <h2>{totalMascotas}</h2>
          <p>Mascotas registradas</p>
        </div>

        <div className="card">
          <h2>{citasHoy}</h2>
          <p>Citas hoy</p>
        </div>

        <div className="card">
          <h2>{atenciones}</h2>
          <p>Atenciones</p>
        </div>

        <div className="card">
          <h2>{citasPendientes}</h2>
          <p>Citas pendientes</p>
        </div>

      </div>

      {/* CALENDARIO */}
      <div style={{ marginTop: 30 }}>
        <h3>Agenda de citas</h3>
        <Calendario eventos={eventos} />
      </div>

      {/* ACTIVIDAD */}
      <div style={{ marginTop: 30 }}>
        <h3>Actividad reciente</h3>

        {actividad.length === 0 ? (
          <p>No hay registros recientes</p>
        ) : (
          actividad.map((item) => (
            <div key={item.id_atencion} className="card" style={{ marginBottom: 10 }}>

              <h4>
                {item.tb_mascota?.nombre} — {item.motivo_consulta}
              </h4>

              <p><strong>Diagnóstico:</strong> {item.diagnostico}</p>
              <p><strong>Veterinario:</strong> {item.tb_veterinario?.nombre}</p>
              <p>
                <strong>Fecha:</strong>{" "}
                {new Date(item.fecha).toLocaleDateString()}
              </p>

            </div>
          ))
        )}

      </div>

      {/* ACCESOS */}
      <div style={{ marginTop: 24 }}>
        <h3>Accesos rápidos</h3>
        <ul>
          <li><Link to="/mascotas">Ver mascotas</Link></li>
          <li><Link to="/citas">Ver citas</Link></li>
        </ul>
      </div>

    </div>
  );
}

export default Dashboard;
