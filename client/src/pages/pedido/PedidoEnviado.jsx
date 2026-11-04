import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconCheck } from "./iconos";

export const REDIRECCION_MS = 6000; // al menos 5 segundos visible

export default function PedidoEnviado({ numero }) {
  const navigate = useNavigate();
  const [llena, setLlena] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setLlena(true));
    const timer = setTimeout(() => navigate("/"), REDIRECCION_MS);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="pedido-ok-titulo"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex flex-col items-center gap-4 bg-emerald-50 px-8 py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
            <IconCheck className="h-8 w-8" />
          </span>
          <h2 id="pedido-ok-titulo" className="text-2xl font-semibold text-emerald-900">
            ¡Solicitud enviada!
          </h2>
          <p className="text-emerald-900/80">
            Muchas gracias por su preferencia, estaremos en contacto con usted lo antes posible
            para tramitar su solicitud.
          </p>
          {numero && <p className="text-sm font-medium text-emerald-800">Solicitud N° {numero}</p>}
          <p className="text-xs text-emerald-800/70">Te llevaremos al inicio en unos segundos...</p>
        </div>
        <div className="h-1.5 bg-emerald-100">
          <div
            className="h-full bg-emerald-500"
            style={{
              width: llena ? "100%" : "0%",
              transition: `width ${REDIRECCION_MS}ms linear`,
            }}
          />
        </div>
      </div>
    </div>
  );
}