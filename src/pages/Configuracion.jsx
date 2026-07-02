import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/configuracion.css";

function Configuracion() {
  const { user, updatePassword, updateProfile } = useAuth();

  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  useEffect(() => {
    setEmail(user?.email || "");
    setTelefono(user?.user_metadata?.phone || "");
  }, [user]);

  function limpiarMensajes() {
    setMensaje("");
    setError("");
  }

  async function guardarPerfil(e) {
    e.preventDefault();
    limpiarMensajes();
    setGuardandoPerfil(true);

    try {
      await updateProfile({
        email,
        phone: telefono,
      });

      setMensaje("Los datos de tu perfil fueron actualizados correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo actualizar el perfil.");
    } finally {
      setGuardandoPerfil(false);
    }
  }

  async function cambiarPassword(e) {
    e.preventDefault();
    limpiarMensajes();

    if (!password || !confirmPassword) {
      setError("Completa los campos de contraseña.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setGuardandoPassword(true);

    try {
      await updatePassword(password);

      setPassword("");
      setConfirmPassword("");
      setMensaje("La contraseña fue actualizada correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo actualizar la contraseña.");
    } finally {
      setGuardandoPassword(false);
    }
  }

  const nombreUsuario =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Usuario";

  const inicial = nombreUsuario.charAt(0).toUpperCase();

  return (
    <div className="configuracion-page">
      <section className="configuracion-hero">
        <div className="configuracion-hero__profile">
          <div className="configuracion-hero__avatar">{inicial}</div>

          <div>
            <span className="configuracion-hero__tag">Cuenta de usuario</span>
            <h1>Configuración</h1>
            <p>Administra tu perfil, correo y seguridad de acceso.</p>
          </div>
        </div>

        <div className="configuracion-hero__email">
          <span>Sesión activa</span>
          <strong>{user?.email || "Sin correo registrado"}</strong>
        </div>
      </section>

      {mensaje && (
        <div className="configuracion-alert configuracion-alert--success">
          <span>✓</span>
          <p>{mensaje}</p>
        </div>
      )}

      {error && (
        <div className="configuracion-alert configuracion-alert--error">
          <span>!</span>
          <p>{error}</p>
        </div>
      )}

      <section className="configuracion-grid">
        <article className="configuracion-card">
          <div className="configuracion-card__header">
            <div className="configuracion-card__icon configuracion-card__icon--blue">
              👤
            </div>

            <div>
              <span className="section-tag">Perfil</span>
              <h2>Datos de contacto</h2>
              <p>Actualiza la información asociada a tu cuenta.</p>
            </div>
          </div>

          <form className="configuracion-form" onSubmit={guardarPerfil}>
            <label>
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </label>

            <label>
              Teléfono
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+51 999 999 999"
              />
            </label>

            <button
              className="configuracion-button configuracion-button--primary"
              type="submit"
              disabled={guardandoPerfil}
            >
              {guardandoPerfil ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </article>

        <article className="configuracion-card">
          <div className="configuracion-card__header">
            <div className="configuracion-card__icon configuracion-card__icon--purple">
              🔐
            </div>

            <div>
              <span className="section-tag">Seguridad</span>
              <h2>Cambiar contraseña</h2>
              <p>Usa una contraseña segura de al menos 6 caracteres.</p>
            </div>
          </div>

          <form className="configuracion-form" onSubmit={cambiarPassword}>
            <label>
              Nueva contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </label>

            <label>
              Confirmar contraseña
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                minLength={6}
              />
            </label>

            <button
              className="configuracion-button configuracion-button--security"
              type="submit"
              disabled={guardandoPassword}
            >
              {guardandoPassword
                ? "Actualizando..."
                : "Actualizar contraseña"}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}

export default Configuracion;