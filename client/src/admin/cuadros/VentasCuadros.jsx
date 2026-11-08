import { useCallback, useEffect, useState } from "react";
import { CircleAlert, Copy, MessageCircle, PackageCheck, Truck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Aviso, EmptyState, Skeleton, Toast, btn, formatDate, inputClass, money } from "@/admin/shared/ui";

const ENVIO = {
  por_enviar: { label: "POR ENVIAR", className: "bg-[#faefd9] text-[#865710]", dot: "bg-[#d99a37]" },
  enviado: { label: "ENVIADO", className: "bg-[#e1eef5] text-[#1f5675]", dot: "bg-[#4f8fb0]" },
  entregado: { label: "ENTREGADO", className: "bg-[#e1f0e6] text-[#2d6844]", dot: "bg-[#5ea67a]" },
};

function Insignia({ estado }) {
  const e = ENVIO[estado] ?? ENVIO.por_enviar;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${e.className}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${e.dot}`} />
      {e.label}
    </span>
  );
}

const entregaTexto = (v) => (v.entrega_tipo === "sucursal" ? `Retiro en sucursal Starken: ${v.direccion}` : v.direccion);

function datosStarken(v) {
  return [
    `Destinatario: ${v.comprador_nombre}`,
    `RUT: ${v.comprador_rut}`,
    `Celular: ${v.comprador_telefono}`,
    `Correo: ${v.comprador_email}`,
    v.entrega_tipo === "sucursal" ? `Retiro en sucursal: ${v.direccion}` : `Dirección: ${v.direccion}`,
    `Comuna: ${v.comuna}`,
    `Región: ${v.region}`,
    "Envío por pagar",
  ].join("\n");
}

/* Ventas pagadas en la web: datos del comprador, envío Starken y devoluciones pendientes. */
export default function VentasCuadros({ onCambio }) {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error: err } = await supabase
      .from("ventas_cuadros")
      .select("*")
      .in("estado", ["aprobado", "requiere_devolucion"])
      .order("pagado_en", { ascending: false });
    if (err) {
      setError(
        ["42P01", "PGRST205"].includes(err.code)
          ? "Falta aplicar la migración de ventas en Supabase (202611070002_ventas_cuadros.sql)."
          : `No se pudieron cargar las ventas. ${err.message}`,
      );
    } else {
      setVentas(data ?? []);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function actualizarEnvio(venta, cambios, mensaje) {
    setError("");
    const { error: err } = await supabase.from("ventas_cuadros").update(cambios).eq("id", venta.id);
    if (err) return setError(`No se pudo actualizar el envío: ${err.message}`);
    setToast(mensaje);
    cargar();
    onCambio?.();
  }

  async function copiar(venta) {
    try {
      await navigator.clipboard.writeText(datosStarken(venta));
      setToast("Datos de envío copiados");
    } catch {
      setError("No se pudieron copiar los datos. Selecciónalos y cópialos a mano.");
    }
  }

  if (cargando) {
    return (
      <div className="grid gap-4 lg:grid-cols-2" aria-label="Cargando ventas">
        {[0, 1].map((n) => <Skeleton key={n} className="h-72 rounded-[26px]" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Aviso onClose={() => setError("")}>{error}</Aviso>}

      {ventas.length === 0 && !error ? (
        <div className="rounded-[26px] border border-white/80 bg-white/80">
          <EmptyState title="Aún no hay ventas por la web" text="Cuando alguien compre un cuadro con Mercado Pago, aquí verás sus datos para enviarlo por Starken." />
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {ventas.map((v) => (
            <TarjetaVenta
              key={v.id}
              venta={v}
              onCopiar={() => copiar(v)}
              onEnviado={(seguimiento) =>
                actualizarEnvio(
                  v,
                  { estado_envio: "enviado", seguimiento_starken: seguimiento || null, enviado_en: new Date().toISOString() },
                  "Venta marcada como enviada",
                )
              }
              onEntregado={() => actualizarEnvio(v, { estado_envio: "entregado" }, "Venta marcada como entregada")}
            />
          ))}
        </ul>
      )}

      {toast && <Toast onClose={() => setToast("")}>{toast}</Toast>}
    </div>
  );
}

function TarjetaVenta({ venta: v, onCopiar, onEnviado, onEntregado }) {
  const [seguimiento, setSeguimiento] = useState(v.seguimiento_starken ?? "");
  const devolucion = v.estado === "requiere_devolucion";
  const whatsapp = `https://wa.me/${v.comprador_telefono.replace(/\D/g, "")}`;

  return (
    <li className="flex flex-col gap-4 rounded-[26px] border border-white/80 bg-white/85 p-5 shadow-[0_18px_40px_-30px_rgb(19_48_61/0.55)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-acento-oscuro">#CL-{v.numero} · {formatDate(v.pagado_en ?? v.created_at)}</p>
          <h3 className="truncate font-semibold text-tinta">{v.cuadro_titulo}</h3>
          <p className="text-sm text-tinta/60">
            {money(v.monto)} · comisión {money(v.comision_monto)}
          </p>
        </div>
        {!devolucion && <Insignia estado={v.estado_envio} />}
      </div>

      {devolucion && (
        <div role="alert" className="flex gap-2.5 rounded-2xl border border-[#ecc8c2] bg-[#fbefed] px-4 py-3 text-sm text-[#963a31]">
          <CircleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            <strong className="block">Hay que devolver este pago.</strong>
            El cuadro ya estaba vendido cuando se aprobó. Devuélvelo desde Mercado Pago (pago {v.mp_payment_id}) y avísale al comprador.
          </p>
        </div>
      )}

      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        {[
          ["Comprador", v.comprador_nombre],
          ["RUT", v.comprador_rut],
          ["Correo", v.comprador_email],
          ["Celular", v.comprador_telefono],
          [v.entrega_tipo === "sucursal" ? "Sucursal Starken" : "Dirección", entregaTexto(v)],
          ["Comuna / región", `${v.comuna}, ${v.region}`],
        ].map(([k, val]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-tinta/50">{k}</dt>
            <dd className="break-words text-tinta">{val}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn.secondary} onClick={onCopiar}>
          <Copy size={16} aria-hidden="true" /> Copiar datos para Starken
        </button>
        <a className={btn.secondary} href={whatsapp} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={16} aria-hidden="true" /> WhatsApp
        </a>
      </div>

      {!devolucion && v.estado_envio === "por_enviar" && (
        <form
          className="flex flex-col gap-2 border-t border-tinta/8 pt-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            onEnviado(seguimiento.trim());
          }}
        >
          <label className="block flex-1 text-sm font-medium text-tinta">
            N° de seguimiento Starken (opcional)
            <input className={`${inputClass} mt-1.5`} value={seguimiento} onChange={(e) => setSeguimiento(e.target.value)} maxLength={60} />
          </label>
          <button type="submit" className={btn.primary}>
            <Truck size={16} aria-hidden="true" /> Marcar enviado
          </button>
        </form>
      )}

      {!devolucion && v.estado_envio === "enviado" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-tinta/8 pt-4 text-sm">
          <p className="text-tinta/70">
            Enviado el {formatDate(v.enviado_en)}
            {v.seguimiento_starken ? ` · seguimiento ${v.seguimiento_starken}` : ""}
          </p>
          <button type="button" className={btn.secondary} onClick={onEntregado}>
            <PackageCheck size={16} aria-hidden="true" /> Marcar entregado
          </button>
        </div>
      )}
    </li>
  );
}
