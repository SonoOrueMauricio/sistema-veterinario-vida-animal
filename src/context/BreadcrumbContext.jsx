import { createContext, useContext, useState, useCallback } from "react";

const BreadcrumbContext = createContext(null);

/** Etiquetas legibles para segmentos de ruta estáticos */
export const ROUTE_LABELS = {
  "": "Inicio",
  mascotas: "Mascotas",
  citas: "Citas",
  consultas: "Atenciones",
  reportes: "Reportes",
  configuracion: "Configuración",
  mascota: "Mascotas",
};

/** Permite registrar nombres dinámicos (ej. nombre de mascota en lugar del ID) */
export function BreadcrumbProvider({ children }) {
  const [dynamicLabels, setDynamicLabels] = useState({});

  const setLabel = useCallback((key, label) => {
    setDynamicLabels((prev) => ({ ...prev, [key]: label }));
  }, []);

  const clearLabel = useCallback((key) => {
    setDynamicLabels((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const getLabel = useCallback(
    (segment, index, parts) => {
      if (parts[index - 1] === "mascota") {
        return dynamicLabels[`mascota-${segment}`] || ROUTE_LABELS.mascota;
      }
      return ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    },
    [dynamicLabels]
  );

  return (
    <BreadcrumbContext.Provider value={{ setLabel, clearLabel, getLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) throw new Error("useBreadcrumb debe usarse dentro de BreadcrumbProvider");
  return ctx;
}
