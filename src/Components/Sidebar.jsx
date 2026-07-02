import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  { to: "/", label: "Dashboard", icon: "🏠", end: true },
  { to: "/mascotas", label: "Mascotas", icon: "🐾" },
  { to: "/citas", label: "Citas", icon: "📅" },
  { to: "/consultas", label: "Atenciones", icon: "🩺" },
  { to: "/reportes", label: "Reportes", icon: "📊" },
  { to: "/configuracion", label: "Configuración", icon: "⚙️" },
];

function Sidebar({ collapsed }) {
  const { user, logout } = useAuth();

  const nombreUsuario =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const inicialUsuario = nombreUsuario.charAt(0).toUpperCase();

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo">🐾</div>

        <div className="sidebar-info">
          <div className="sidebar-name">AnimalVet</div>
          <div className="sidebar-role">Clínica Veterinaria</div>
        </div>
      </div>

      <div className="sidebar-section-label">MENÚ PRINCIPAL</div>

      <nav className="sidebar-navigation">
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? "sidebar-item active" : "sidebar-item"
                }
              >
                <span className="icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{inicialUsuario}</div>

          <div className="sidebar-user-info">
            <strong>{nombreUsuario}</strong>
            <span>{user?.email || "Usuario activo"}</span>
          </div>
        </div>

        <button
          className="sidebar-logout"
          onClick={logout}
          type="button"
          title="Cerrar sesión"
        >
          <span>🚪</span>
          <span className="sidebar-label">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;