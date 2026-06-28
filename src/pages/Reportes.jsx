import { useEffect, useState, useMemo } from "react";
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

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function Reportes() {
  const [atenciones, setAtenciones] = useState([]);
  const [totalCitas, setTotalCitas] = useState(0);
  const [totalAtenciones, setTotalAtenciones] = useState(0);
  const [totalMascotas, setTotalMascotas] = useState(0);

  useEffect(() => {
    cargarMetricas();
    cargarAtenciones();
  }, []);

  /** Carga totales de citas, atenciones y mascotas */
  async function cargarMetricas() {
    const [citasRes, atencionesRes, mascotasRes] = await Promise.all([
      supabase.from("tb_cita").select("*", { count: "exact", head: true }),
      supabase.from("tb_atencion").select("*", { count: "exact", head: true }),
      supabase.from("tb_mascota").select("*", { count: "exact", head: true }),
    ]);

    setTotalCitas(citasRes.count || 0);
    setTotalAtenciones(atencionesRes.count || 0);
    setTotalMascotas(mascotasRes.count || 0);
  }

  /** Obtiene fechas de atenciones para el gráfico mensual */
  async function cargarAtenciones() {
    const { data, error } = await supabase.from("tb_atencion").select("fecha");

    if (!error) {
      setAtenciones(data || []);
    }
  }

  /** Agrupa atenciones por mes para el gráfico principal */
  const datosMensuales = useMemo(() => {
    const conteo = Array(12).fill(0);
    const anioActual = new Date().getFullYear();

    atenciones.forEach((a) => {
      if (!a.fecha) return;
      const fecha = new Date(a.fecha);
      if (fecha.getFullYear() === anioActual) {
        conteo[fecha.getMonth()]++;
      }
    });

    return MESES.map((mes, i) => ({
      mes,
      atenciones: conteo[i],
    }));
  }, [atenciones]);

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1>Reportes</h1>
          <p className="subtitle">Rendimiento y métricas de la clínica</p>
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className="cards-container">
        <div className="card kpi-card">
          <h2>{totalCitas}</h2>
          <p>Total de citas</p>
        </div>
        <div className="card kpi-card">
          <h2>{totalAtenciones}</h2>
          <p>Total de atenciones</p>
        </div>
        <div className="card kpi-card">
          <h2>{totalMascotas}</h2>
          <p>Mascotas registradas</p>
        </div>
      </div>

      {/* Gráfico principal: atenciones por mes */}
      <div className="page-card chart-card">
        <h3>Atenciones por mes ({new Date().getFullYear()})</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={datosMensuales}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="mes" tick={{ fill: "#222" }} />
            <YAxis allowDecimals={false} tick={{ fill: "#222" }} />
            <Tooltip />
            <Bar dataKey="atenciones" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Reportes;
