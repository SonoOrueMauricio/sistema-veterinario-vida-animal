import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Configuracion() {
  const { user, updatePassword, updateProfile } = useAuth();

  const [email, setEmail] = useState(user?.email || "");
  const [telefono, setTelefono] = useState(user?.user_metadata?.phone || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  /** Actualiza correo y teléfono del usuario autenticado */
  async function guardarPerfil(e) {
    e.preventDefault();
    setMensaje("");
    setError("");
    setGuardando(true);

    try {
      await updateProfile({ email, phone: telefono });
      setMensaje("Perfil actualizado correctamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  /** Cambia la contraseña del usuario autenticado */
  async function cambiarPassword(e) {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setGuardando(true);

    try {
      await updatePassword(password);
      setPassword("");
      setConfirmPassword("");
      setMensaje("Contraseña actualizada correctamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1>Configuración</h1>
          <p className="subtitle">Administra tu cuenta de usuario</p>
        </div>
      </div>

      <div className="config-grid">
        {/* Actualizar correo y teléfono */}
        <section className="page-card">
          <h3>Datos de contacto</h3>
          <form className="config-form" onSubmit={guardarPerfil}>
            <label className="form-label">
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="form-label">
              Teléfono
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+51 999 999 999"
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={guardando}>
              Guardar cambios
            </button>
          </form>
        </section>

        {/* Cambiar contraseña */}
        <section className="page-card">
          <h3>Cambiar contraseña</h3>
          <form className="config-form" onSubmit={cambiarPassword}>
            <label className="form-label">
              Nueva contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </label>
            <label className="form-label">
              Confirmar contraseña
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={guardando}>
              Actualizar contraseña
            </button>
          </form>
        </section>
      </div>

      {mensaje && <p className="form-success">{mensaje}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default Configuracion;
