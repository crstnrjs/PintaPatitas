import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { cerrarSesionExpirada, motivoExpiracion, registrarActividad } from "./sesionAdmin";

const EVENTOS_ACTIVIDAD = ["pointerdown", "keydown", "scroll", "touchstart"];

/**
 * Vigila la sesión mientras el panel está abierto: registra actividad, revisa
 * los límites cada 30 s y al volver a la pestaña (en el celular los timers se
 * pausan en segundo plano), y redirige al login si la sesión termina.
 */
export function useExpiracionSesion() {
  const navigate = useNavigate();

  useEffect(() => {
    let cerrando = false;

    async function revisar() {
      if (cerrando) return;
      const { data: { session } } = await supabase.auth.getSession();
      const motivo = motivoExpiracion(session);
      if (!motivo) return;
      cerrando = true;
      await cerrarSesionExpirada(motivo);
      navigate("/admin/login", { replace: true });
    }

    function alVolver() {
      if (document.visibilityState === "visible") revisar();
    }

    EVENTOS_ACTIVIDAD.forEach((e) => window.addEventListener(e, registrarActividad, { passive: true }));
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", revisar);
    const intervalo = setInterval(revisar, 30_000);

    // Cierre en otra pestaña o token revocado: volver al login.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, session) => {
      if (evento === "SIGNED_OUT" || !session) navigate("/admin/login", { replace: true });
    });

    return () => {
      EVENTOS_ACTIVIDAD.forEach((e) => window.removeEventListener(e, registrarActividad));
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", revisar);
      clearInterval(intervalo);
      subscription.unsubscribe();
    };
  }, [navigate]);
}
