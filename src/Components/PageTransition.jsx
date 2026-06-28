import { useLocation } from "react-router-dom";

/** Envuelve el contenido de página con transición fade suave al cambiar de ruta */
function PageTransition({ children }) {
  const location = useLocation();

  return (
    <div className="page-transition" key={location.pathname}>
      {children}
    </div>
  );
}

export default PageTransition;
