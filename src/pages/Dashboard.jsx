import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import Calendario from "../Components/Calendario";
import "../styles/dashboard.css";

function Dashboard() {
  // KPI
  const [totalMascotas, setTotalMascotas] = useState(0);
  const [citasHoy, setCitasHoy] = useState(0);
  const [atenciones, setAtenciones] = useState(0);
  const [citasPendientes, setCitasPendientes] = useState(0);

  // Actividad reciente
  const [actividad, setActividad] = useState([]);

  // Eventos calendario
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    cargarKPIs();
    cargarActividad();
    cargarEventos();
  }, []);

  async function cargarKPIs() {
    const { count: mascotasCount } = await supabase
      .from("tb_mascota")
      .select("*", { count: "exact", head: true });

    setTotalMascotas(mascotasCount || 0);

    const hoy = new Date().toISOString().split("T")[0];

    const { count: citasHoyCount } = await supabase
      .from("tb_cita")
      .select("*", { count: "exact", head: true })
      .eq("fecha", hoy);

    setCitasHoy(citasHoyCount || 0);

    const { count: atencionesCount } = await supabase
      .from("tb_atencion")
      .select("*", { count: "exact", head: true });

    setAtenciones(atencionesCount || 0);

    const { count: pendientesCount } = await supabase
      .from("tb_cita")
      .select("*", { count: "exact", head: true })
      .eq("estado", "Pendiente");

    setCitasPendientes(pendientesCount || 0);
  }

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
      setActividad(data || []);
    } else {
      console.error("Error actividad:", error);
    }
  }

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
      const eventosFormateados = (data || []).map((item) => ({
        title: item.tb_mascota?.nombre || "Mascota",
        start: `${item.fecha}T${item.hora}`,
        color: item.estado === "Pendiente" ? "#f59e0b" : "#22c55e",
      }));

      setEventos(eventosFormateados);
    } else {
      console.error("Error eventos:", error);
    }
  }

  const resumenCards = [
    {
      titulo: "Mascotas registradas",
      valor: totalMascotas,
      icono: "🐾",
      descripcion: "Pacientes activos en el sistema",
      clase: "stat-blue",
    },
    {
      titulo: "Citas hoy",
      valor: citasHoy,
      icono: "📅",
      descripcion: "Agenda programada para hoy",
      clase: "stat-green",
    },
    {
      titulo: "Atenciones",
      valor: atenciones,
      icono: "🩺",
      descripcion: "Consultas registradas",
      clase: "stat-purple",
    },
    {
      titulo: "Citas pendientes",
      valor: citasPendientes,
      icono: "⏳",
      descripcion: "Pendientes por atender",
      clase: "stat-orange",
    },
  ];

  return (
    <div>
      <div className="dashboard-title-block">
        <span className="dashboard-mini-badge">Panel de control</span>
        <h1>Bienvenido al sistema</h1>
        <p>Resumen general de tu clínica veterinaria.</p>
      </div>

      {/* KPI / ESTADÍSTICAS */}
      <section className="stats-section">
        {resumenCards.map((item) => (
          <article key={item.titulo} className={`stat-card ${item.clase}`}>
            <div className="stat-card__top">
              <div className="stat-card__icon">{item.icono}</div>

              <div className="stat-card__text">
                <span className="stat-card__label">{item.titulo}</span>
                <h2 className="stat-card__value">{item.valor}</h2>
              </div>
            </div>

            <div className="stat-card__bottom">
              <p>{item.descripcion}</p>
            </div>
          </article>
        ))}
      </section>

      {/* CALENDARIO */}
      <section className="dashboard-calendar-section">
        <div className="dashboard-section-header">
          <div>
            <span className="section-tag">Agenda clínica</span>
            <h3>Agenda de citas</h3>
            <p>Visualiza las citas programadas y su estado actual.</p>
          </div>
        </div>

        <div className="dashboard-calendar-container">
          <Calendario eventos={eventos} />
        </div>
      </section>

      {/* ACTIVIDAD RECIENTE */}
      <section className="recent-activity-section">
        <div className="recent-activity-header">
          <div>
            <span className="section-tag">Seguimiento clínico</span>
            <h3>Actividad reciente</h3>
            <p>Últimas atenciones registradas en la clínica veterinaria.</p>
          </div>
        </div>

        {actividad.length === 0 ? (
          <div className="recent-empty-state">
            <div className="recent-empty-state__icon">📭</div>
            <h4>No hay actividad reciente</h4>
            <p>Aún no se han registrado atenciones en el sistema.</p>
          </div>
        ) : (
          <div className="recent-activity-grid">
            {actividad.map((item) => (
              <article key={item.id_atencion} className="recent-activity-card">
                <div className="recent-activity-card__top">
                  <div className="recent-activity-card__identity">
                    <div className="recent-activity-card__avatar">
                      {item.tb_mascota?.nombre?.charAt(0)?.toUpperCase() || "M"}
                    </div>

                    <div>
                      <h4>
                        {item.tb_mascota?.nombre || "Mascota"} —{" "}
                        {item.motivo_consulta || "Consulta general"}
                      </h4>

                      <span className="recent-activity-card__subtitle">
                        Atención veterinaria registrada
                      </span>
                    </div>
                  </div>

                  <span className="recent-activity-card__date">
                    {new Date(item.fecha).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="recent-activity-card__body">
                  <div className="recent-activity-info">
                    <span className="recent-activity-info__label">
                      Diagnóstico
                    </span>

                    <p>{item.diagnostico || "Sin diagnóstico registrado"}</p>
                  </div>

                  <div className="recent-activity-meta">
                    <div className="recent-meta-chip">
                      <span className="recent-meta-chip__icon">🩺</span>
                      <span>
                        <strong>Veterinario:</strong>{" "}
                        {item.tb_veterinario?.nombre || "No asignado"}
                      </span>
                    </div>

                    <div className="recent-meta-chip">
                      <span className="recent-meta-chip__icon">📌</span>
                      <span>
                        <strong>Motivo:</strong>{" "}
                        {item.motivo_consulta || "No especificado"}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ACCESOS RÁPIDOS */}
      <section className="quick-links-section">
        <div className="dashboard-section-header">
          <div>
            <span className="section-tag">Navegación rápida</span>
            <h3>Accesos rápidos</h3>
            <p>Ingresa directamente a los módulos principales del sistema.</p>
          </div>
        </div>

        <div className="quick-links-grid">
          <Link to="/mascotas" className="quick-link-card">
            <span className="quick-link-card__icon">🐾</span>
            <div>
              <strong>Mascotas</strong>
              <p>Consulta y registra pacientes.</p>
            </div>
          </Link>

          <Link to="/citas" className="quick-link-card">
            <span className="quick-link-card__icon">📅</span>
            <div>
              <strong>Citas</strong>
              <p>Gestiona la agenda veterinaria.</p>
            </div>
          </Link>

          <Link to="/consultas" className="quick-link-card">
            <span className="quick-link-card__icon">🩺</span>
            <div>
              <strong>Consultas</strong>
              <p>Revisa atenciones e historial clínico.</p>
            </div>
          </Link>

          <Link to="/reportes" className="quick-link-card">
            <span className="quick-link-card__icon">📊</span>
            <div>
              <strong>Reportes</strong>
              <p>Analiza la información de la clínica.</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;