import { useLocation, Link } from "react-router-dom";
import { useBreadcrumb } from "../context/BreadcrumbContext";

/** Enlaces navegables excepto el último segmento */
function Breadcrumb() {
  const location = useLocation();
  const { getLabel } = useBreadcrumb();

  const parts = location.pathname.split("/").filter(Boolean);

  const items = [
    { label: "Inicio", to: "/", isLast: parts.length === 0 },
    ...parts.map((part, index) => {
      const to = `/${parts.slice(0, index + 1).join("/")}`;
      const label = getLabel(part, index, parts);
      return { label, to, isLast: index === parts.length - 1 };
    }),
  ];

  return (
    <nav className="breadcrumb" aria-label="Ruta de navegación">
      {items.map((item, idx) => (
        <span key={item.to} className="breadcrumb-item">
          {idx > 0 && <span className="breadcrumb-sep">/</span>}
          {item.isLast ? (
            <span className="breadcrumb-current">{item.label}</span>
          ) : (
            <Link to={item.to}>{item.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumb;
