import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../services/supabaseClient";
import "../styles/reportes.css";

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

function Reportes() {
  const [atenciones, setAtenciones] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [totalCitas, setTotalCitas] = useState(0);
  const [totalAtenciones, setTotalAtenciones] = useState(0);
  const [totalMascotas, setTotalMascotas] = useState(0);
  const [citasPendientes, setCitasPendientes] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarReportes();
  }, []);

  async function cargarReportes() {
    setCargando(true);

    const [
      citasRes,
      atencionesRes,
      mascotasRes,
      citasPendientesRes,
      atencionesDataRes,
      mascotasDataRes,
    ] = await Promise.all([
      supabase.from("tb_cita").select("*", { count: "exact", head: true }),
      supabase.from("tb_atencion").select("*", { count: "exact", head: true }),
      supabase.from("tb_mascota").select("*", { count: "exact", head: true }),
      supabase
        .from("tb_cita")
        .select("*", { count: "exact", head: true })
        .eq("estado", "Pendiente"),
      supabase.from("tb_atencion").select("fecha"),
      supabase.from("tb_mascota").select("especie"),
    ]);

    setTotalCitas(citasRes.count || 0);
    setTotalAtenciones(atencionesRes.count || 0);
    setTotalMascotas(mascotasRes.count || 0);
    setCitasPendientes(citasPendientesRes.count || 0);

    if (!atencionesDataRes.error) {
      setAtenciones(atencionesDataRes.data || []);
    }

    if (!mascotasDataRes.error) {
      setMascotas(mascotasDataRes.data || []);
    }

    setCargando(false);
  }

  const datosMensuales = useMemo(() => {
    const conteo = Array(12).fill(0);
    const anioActual = new Date().getFullYear();

    atenciones.forEach((atencion) => {
      if (!atencion.fecha) return;

      const fecha = new Date(`${atencion.fecha}T00:00:00`);

      if (fecha.getFullYear() === anioActual) {
        conteo[fecha.getMonth()]++;
      }
    });

    return MESES.map((mes, index) => ({
      mes,
      atenciones: conteo[index],
    }));
  }, [atenciones]);

  const mascotasPorEspecie = useMemo(() => {
    const especies = {};

    mascotas.forEach((mascota) => {
      const especie = mascota.especie?.trim() || "Sin especie";

      especies[especie] = (especies[especie] || 0) + 1;
    });

    return Object.entries(especies)
      .map(([especie, cantidad]) => ({
        especie,
        cantidad,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [mascotas]);

  const mesConMasAtenciones = useMemo(() => {
    const resultado = [...datosMensuales].sort(
      (a, b) => b.atenciones - a.atenciones
    )[0];

    if (!resultado || resultado.atenciones === 0) {
      return "Sin registros";
    }

    return resultado.mes;
  }, [datosMensuales]);

  return (
    <div className="reportes-page">
      <section className="reportes-hero">
        <div>
          <span className="reportes-hero__tag">Análisis de la clínica</span>
          <h1>Reportes y métricas</h1>
          <p>
            Revisa el resumen operativo de citas, pacientes y atenciones
            registradas en la veterinaria.
          </p>
        </div>

        <div className="reportes-hero__year">
          <span>Periodo analizado</span>
          <strong>{new Date().getFullYear()}</strong>
        </div>
      </section>

      <section className="reportes-kpi-grid">
        <article className="reportes-kpi-card reportes-kpi-card--blue">
          <div className="reportes-kpi-card__icon">📅</div>
          <div>
            <span>Total de citas</span>
            <strong>{totalCitas}</strong>
          </div>
        </article>

        <article className="reportes-kpi-card reportes-kpi-card--green">
          <div className="reportes-kpi-card__icon">🩺</div>
          <div>
            <span>Atenciones clínicas</span>
            <strong>{totalAtenciones}</strong>
          </div>
        </article>

        <article className="reportes-kpi-card reportes-kpi-card--purple">
          <div className="reportes-kpi-card__icon">🐾</div>
          <div>
            <span>Mascotas registradas</span>
            <strong>{totalMascotas}</strong>
          </div>
        </article>

        <article className="reportes-kpi-card reportes-kpi-card--orange">
          <div className="reportes-kpi-card__icon">⏳</div>
          <div>
            <span>Citas pendientes</span>
            <strong>{citasPendientes}</strong>
          </div>
        </article>
      </section>

      {cargando ? (
        <div className="reportes-loading">
          <span>⏳</span>
          <p>Cargando información para los reportes...</p>
        </div>
      ) : (
        <section className="reportes-content-grid">
          <article className="reportes-chart-card">
            <div className="reportes-card-header">
              <div>
                <span className="section-tag">Actividad clínica</span>
                <h2>Atenciones por mes</h2>
                <p>
                  Cantidad de atenciones registradas durante{" "}
                  {new Date().getFullYear()}.
                </p>
              </div>

              <div className="reportes-highlight">
                <span>Mes con mayor actividad</span>
                <strong>{mesConMasAtenciones}</strong>
              </div>
            </div>

            <div className="reportes-chart-container">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={datosMensuales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" tick={{ fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tick={{ fill: "#64748b" }} />
                  <Tooltip />
                  <Bar
                    dataKey="atenciones"
                    fill="#2563eb"
                    radius={[7, 7, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="reportes-species-card">
            <div className="reportes-card-header">
              <div>
                <span className="section-tag">Pacientes</span>
                <h2>Mascotas por especie</h2>
                <p>Distribución de los pacientes registrados.</p>
              </div>
            </div>

            {mascotasPorEspecie.length === 0 ? (
              <div className="reportes-empty">
                <span>🐾</span>
                <p>No hay mascotas registradas todavía.</p>
              </div>
            ) : (
              <div className="reportes-species-list">
                {mascotasPorEspecie.map((item) => {
                  const porcentaje =
                    totalMascotas > 0
                      ? Math.round((item.cantidad / totalMascotas) * 100)
                      : 0;

                  return (
                    <div key={item.especie} className="reportes-species-item">
                      <div className="reportes-species-item__top">
                        <span>
                          {item.especie.toLowerCase().includes("gato")
                            ? "🐱"
                            : "🐶"}{" "}
                          {item.especie}
                        </span>

                        <strong>{item.cantidad}</strong>
                      </div>

                      <div className="reportes-progress">
                        <span style={{ width: `${porcentaje}%` }} />
                      </div>

                      <small>{porcentaje}% del total de pacientes</small>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </section>
      )}
    </div>
  );
}

export default Reportes;