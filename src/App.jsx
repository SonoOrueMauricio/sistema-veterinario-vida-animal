import { useEffect, useState } from "react";
import { supabase } from "./services/supabaseClient";

function App() {
  const [mensaje, setMensaje] = useState("Conectando con Supabase...");

  useEffect(() => {
    obtenerMascotas();
  }, []);

  async function obtenerMascotas() {
    const { data, error } = await supabase
      .from("tb_mascota")
      .select("*");

    if (error) {
      setMensaje(`Error: ${error.message}`);
      console.error("Error al obtener mascotas:", error.message, error.status);
    } else {
      setMensaje(`Conectado correctamente. Mascotas encontradas: ${data?.length ?? 0}`);
      console.log("Datos de mascotas:", data);
    }
  }

  return (
    <div>
      <h1>Sistema Veterinario 🐾</h1>
      <p>{mensaje}</p>
    </div>
  );
}

export default App;
