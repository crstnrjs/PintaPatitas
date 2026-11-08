import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiUrl } from "@/lib/api";

// Mercado Pago cobra aprox. 3,8 % por cada pago recibido. Es una estimación para mostrar al
// panel: no se configura en el servidor porque lo descuenta Mercado Pago.
export const MP_PORCENTAJE = 3.8;

// Se piden una sola vez y se comparten entre pantallas.
let cache = null;

/* Comisión de la plataforma y abono con los que el servidor cobra (COMISION_PORCENTAJE y ABONO_PORCENTAJE). */
export function useCobros() {
  const [cobros, setCobros] = useState(cache ?? { comision: null, abono: null, cargado: false });

  useEffect(() => {
    if (cache) return;
    let activo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const res = await fetch(apiUrl("/api/configuracion/cobros"), {
          headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        });
        const json = res.ok ? await res.json() : {};
        const valor = { comision: json.comision_porcentaje ?? null, abono: json.abono_porcentaje ?? null, cargado: true };
        if (res.ok) cache = valor;
        if (activo) setCobros(valor);
      } catch {
        if (activo) setCobros({ comision: null, abono: null, cargado: true });
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  return cobros;
}

// 7 → "7 %"; 3.8 → "3,8 %"
export const pct = (n) => (n == null ? "—" : `${String(n).replace(".", ",")} %`);
