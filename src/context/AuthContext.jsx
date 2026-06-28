import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

const AuthContext = createContext(null);

/** Provee autenticación Supabase a toda la aplicación */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /** Inicia sesión con correo y contraseña */
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  /** Cierra la sesión del usuario autenticado */
  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /** Actualiza la contraseña del usuario */
  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  /** Actualiza correo y teléfono en metadata del usuario */
  async function updateProfile({ email, phone }) {
    const updates = {};
    if (email) updates.email = email;
    if (phone !== undefined) {
      updates.data = { phone };
    }
    const { error } = await supabase.auth.updateUser(updates);
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updatePassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
