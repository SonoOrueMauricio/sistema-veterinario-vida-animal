import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Breadcrumb from "./Breadcrumb";

/** Títulos de página según la ruta actual */
const titles = {
  "/": "Dashboard",
  "/mascotas": "Mascotas",
  "/citas": "Citas",
  "/consultas": "Atenciones",
  "/reportes": "Reportes",
  "/configuracion": "Configuración",
};

/** Calcula la ruta padre para el botón Volver */
function getBackPath(pathname) {
  if (pathname.startsWith("/mascota/")) return "/mascotas";
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 1) return `/${parts.slice(0, -1).join("/")}`;
  return null;
}

function Header({ onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const title = useMemo(() => {
    if (location.pathname.startsWith("/mascota/")) {
      return "Detalle de mascota";
    }
    return titles[location.pathname] || "Sistema veterinario";
  }, [location.pathname]);

  const backPath = getBackPath(location.pathname);

  /** Cierra sesión y redirige al login */
  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  }

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={onToggle} aria-label="Colapsar sidebar">
          ☰
        </button>
        <div className="header-title">
          <h1>{title}</h1>
          <Breadcrumb />
        </div>
      </div>

      <div className="header-actions">
        {backPath && (
          <button className="btn btn-outline" onClick={() => navigate(backPath)}>
            Volver
          </button>
        )}
        <button className="btn btn-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}

export default Header;
