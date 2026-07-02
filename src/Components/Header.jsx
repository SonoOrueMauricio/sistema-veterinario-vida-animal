import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Breadcrumb from "./Breadcrumb";

const titles = {
  "/": "Dashboard",
  "/mascotas": "Mascotas",
  "/citas": "Citas",
  "/consultas": "Atenciones",
  "/reportes": "Reportes",
  "/configuracion": "Configuración",
};

function getBackPath(pathname) {
  if (pathname.startsWith("/mascota/")) return "/mascotas";

  const parts = pathname.split("/").filter(Boolean);

  if (parts.length > 1) {
    return `/${parts.slice(0, -1).join("/")}`;
  }

  return null;
}

function Header({ onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const title = useMemo(() => {
    if (location.pathname.startsWith("/mascota/")) {
      return "Ficha clínica";
    }

    return titles[location.pathname] || "Sistema veterinario";
  }, [location.pathname]);

  const backPath = getBackPath(location.pathname);

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
        <button
          className="menu-btn"
          onClick={onToggle}
          type="button"
          aria-label="Mostrar u ocultar menú lateral"
          title="Mostrar u ocultar menú"
        >
          ☰
        </button>

        <div className="header-title">
          <h1>{title}</h1>
          <Breadcrumb />
        </div>
      </div>

      <div className="header-actions">
        {backPath && (
          <button
            className="header-back-button"
            onClick={() => navigate(backPath)}
            type="button"
          >
            ← Volver
          </button>
        )}

          <button
          className="header-logout-button"
          onClick={handleLogout}
          type="button"
          title="Cerrar sesión"
        >
          <span>🚪</span>
          <span className="header-logout-button__label">Salir</span>
        </button>
      </div>
    </header>
  );
}

export default Header;