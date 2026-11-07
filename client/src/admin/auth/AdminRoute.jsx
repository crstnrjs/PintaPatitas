import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { cerrarSesionExpirada, motivoExpiracion } from "./sesionAdmin";

export default function AdminRoute({ children }) {
  const [state, setState] = useState("loading"); // loading | ok | denied

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setState("denied");

      // Al reabrir el panel (p. ej. al día siguiente en el celular) se aplican
      // los límites de inactividad y duración antes de mostrar nada.
      const motivo = motivoExpiracion(session);
      if (motivo) {
        await cerrarSesionExpirada(motivo);
        return setState("denied");
      }

      const { data } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!data) {
        await supabase.auth.signOut();
        return setState("denied");
      }

      setState("ok");
    }
    check();
  }, []);

  if (state === "loading") return null;
  if (state === "denied") return <Navigate to="/admin/login" replace />;
  return children;
}