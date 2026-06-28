import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { BreadcrumbProvider } from "./context/BreadcrumbContext";
import Sidebar from "./Components/Sidebar";
import Header from "./Components/Header";
import ProtectedRoute from "./Components/ProtectedRoute";
import PageTransition from "./Components/PageTransition";

import Dashboard from "./pages/Dashboard";
import Mascotas from "./pages/Mascotas";
import DetalleMascota from "./pages/DetalleMascota";
import Citas from "./pages/Citas";
import Consultas from "./pages/Consultas";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import Login from "./pages/Login";

import "./App.css";

/** Layout principal con sidebar fijo y área de contenido con scroll */
function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  function toggleSidebar() {
    setCollapsed((s) => !s);
  }

  return (
    <div className="dashboard">
      <Sidebar collapsed={collapsed} />

      <div className={`main ${collapsed ? "sidebar-collapsed" : ""}`}>
        <Header onToggle={toggleSidebar} />

        <div className="content-scroll">
          <div className="content">
            <PageTransition>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="mascotas" element={<Mascotas />} />
                <Route path="citas" element={<Citas />} />
                <Route path="consultas" element={<Consultas />} />
                <Route path="reportes" element={<Reportes />} />
                <Route path="configuracion" element={<Configuracion />} />
                <Route path="mascota/:id" element={<DetalleMascota />} />
              </Routes>
            </PageTransition>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BreadcrumbProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BreadcrumbProvider>
    </AuthProvider>
  );
}

export default App;
