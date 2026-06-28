import { NavLink } from "react-router-dom";

const menuItems = [
  { to: "/", label: "Dashboard", icon: "🏠", end: true },
  { to: "/mascotas", label: "Mascotas", icon: "🐾" },
  { to: "/citas", label: "Citas", icon: "📅" },
  { to: "/consultas", label: "Atenciones", icon: "🩺" },
  { to: "/reportes", label: "Reportes", icon: "📊" },
  { to: "/configuracion", label: "Configuración", icon: "⚙️" },
];

function Sidebar({ collapsed }) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <div className="sidebar-avatar">CVet</div>
        <div className="sidebar-info">
          <div className="sidebar-name">AnimalVet</div>
          <div className="sidebar-role">Clínica Veterinaria</div>
        </div>
      </div>

      <nav>
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'sidebar-item active' : 'sidebar-item')}
              >
                <span className="icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;

