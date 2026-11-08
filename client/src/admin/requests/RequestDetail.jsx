import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Brush,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleX,
  ExternalLink,
  MessageSquareQuote,
  X,
  ZoomIn,
  ClipboardCheck,
  Copy,
  CreditCard,
  Frame,
  Inbox,
  Truck,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Aviso, EmptyState, Panel, Skeleton, StatusBadge, btn, formatDate, initials, money, orderCode } from "@/admin/shared/ui";
import { apiUrl } from "@/lib/api";
import { MP_PORCENTAJE, pct, useCobros } from "@/admin/shared/useCobros";

const sumAmount = (list) => list.reduce((acc, p) => acc + p.amount, 0);

// Botones sobre la tarjeta "Siguiente paso" (fondo azul)
const primaryBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-acento-oscuro shadow-[0_8px_18px_-10px_rgb(0_0_0/0.5)] transition hover:bg-papel active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtn =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";



export default function RequestDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0); // al cambiarlo, se recargan los datos
  const [tracking, setTracking] = useState("");
  const [copied, setCopied] = useState(false);
  const cobros = useCobros();

  useEffect(() => {
    let ignore = false;

    async function load() {
      const [orderRes, paymentsRes, photosRes] = await Promise.all([
        supabase.from("orders").select("*").eq("id", id).maybeSingle(),
        supabase.from("payments").select("*").eq("order_id", id).order("created_at"),
        supabase.from("order_photos").select("storage_path").eq("order_id", id),
      ]);
      if (ignore) return;

      if (orderRes.error || !orderRes.data) {
        setError("Solicitud no encontrada");
        setLoading(false);
        return;
      }

      let urls = [];
      const paths = (photosRes.data ?? []).map((p) => p.storage_path);
      if (paths.length) {
        const { data } = await supabase.storage
          .from("pet-photos")
          .createSignedUrls(paths, 3600);
        urls = (data ?? []).filter((d) => d.signedUrl).map((d) => d.signedUrl);
      }
      if (ignore) return;

      setOrder(orderRes.data);
      setPayments(paymentsRes.data ?? []);
      setPhotos(urls);
      setLoading(false);
    }

    load();
    return () => {
      ignore = true;
    };
  }, [id, version]);

  // Cambios simples de estado (directo a Supabase, protegido por RLS)
  async function changeStatus(next, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return;
    setSaving(true);
    setActionError("");

    const { data, error } = await supabase
      .from("orders")
      .update({ status: next })
      .eq("id", id)
      .select("status");

    setSaving(false);

    if (error || !data?.length) {
      setActionError("No se pudo actualizar el estado");
      return;
    }
    setOrder((o) => ({ ...o, status: data[0].status }));
  }

  // Aceptar la solicitud: lo hace el server (más adelante crea el link de pago y avisa al cliente)
  async function acceptRequest() {
    if (
      !window.confirm(
        "Se aceptará esta solicitud y el cliente podrá pagar el abono. ¿Continuar?",
      )
    )
      return;
    setSaving(true);
    setActionError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(apiUrl(`/api/orders/${id}/accept`), {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo aceptar la solicitud.");
      setVersion((v) => v + 1);
    } catch (err) {
      setActionError(
        err instanceof TypeError
          ? "No se pudo conectar con el servidor. Revisa que esté activo."
          : err.message,
      );
    }
    setSaving(false);
  }

  async function markPaintingDone() {
    if (!window.confirm("¿Confirmas que la pintura está terminada? Después podrás generar el cobro del saldo.")) {
      return;
    }

    setSaving(true);
    setActionError("");
    const completedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("orders")
      .update({ painting_done_at: completedAt })
      .eq("id", id)
      .eq("status", "en_proceso")
      .select("painting_done_at")
      .maybeSingle();

    setSaving(false);

    if (error || !data) {
      setActionError("No se pudo marcar la pintura como terminada.");
      return;
    }

    setOrder((current) => ({ ...current, painting_done_at: data.painting_done_at }));
  }

  // Pedir el saldo: lo hace el server (necesita la clave de Mercado Pago)
  async function requestBalance(amount) {
    if (
      !window.confirm(
        `Se generará un enlace de Mercado Pago para el saldo de ${money(amount)} y se enviará al cliente. Se descontará del saldo la comisión de plataforma configurada. ¿Continuar?`,
      )
    )
      return;
    setSaving(true);
    setActionError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(apiUrl(`/api/orders/${id}/request-balance`), {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.error ?? "No se pudo generar el cobro del saldo.");
      }
      setVersion((v) => v + 1);
    } catch (err) {
      setActionError(
        err instanceof TypeError
          ? "No se pudo conectar con el servidor. Revisa que esté activo."
          : err.message,
      );
    }
    setSaving(false);
  }

  async function markShipped() {
    setSaving(true);
    setActionError("");

    const { data, error } = await supabase
      .from("orders")
      .update({
        status: "finalizado",
        shipped_at: new Date().toISOString(),
        tracking_code: tracking.trim() || null,
      })
      .eq("id", id)
      .select("status, shipped_at, tracking_code");

    setSaving(false);

    if (error || !data?.length) {
      setActionError("No se pudo marcar como enviado");
      return;
    }
    setOrder((o) => ({ ...o, ...data[0] }));
  }

  async function copyLink(url) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading)
    return (
      <div className="space-y-5" aria-label="Cargando solicitud">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  if (error)
    return (
      <div>
        <Panel>
          <EmptyState title={error} text="Puede que el enlace esté incompleto o que la solicitud ya no exista.">
            <Link to="/admin/solicitudes" className={btn.secondary}>
              Volver a solicitudes
            </Link>
          </EmptyState>
        </Panel>
      </div>
    );

  const approved = payments.filter((p) => p.status === "aprobado");
  const abonoPaid = sumAmount(approved.filter((p) => p.type === "abono"));
  const saldoPaid = sumAmount(approved.filter((p) => p.type === "saldo"));
  const pending = Math.max(order.total_amount - abonoPaid - saldoPaid, 0);

  const saldoPayment = payments.find((p) => p.type === "saldo");

  // MP cobra su comisión dos veces: una al cobrar el abono y otra al cobrar el saldo
  const abonoRef         = Number(order.deposit_amount) || 0;
  const saldoRef         = Math.max(Number(order.total_amount) - abonoRef, 0);
  const comisionMpAbono  = Math.round(abonoRef * MP_PORCENTAJE / 100);
  const comisionMpSaldo  = Math.round(saldoRef * MP_PORCENTAJE / 100);
  const comisionMpTotal  = comisionMpAbono + comisionMpSaldo;
  // Comisión de la plataforma: la que quedó registrada al crear el cobro del saldo; si aún
  // no existe, la que usará el servidor (COMISION_PORCENTAJE).
  const comisionPct      = saldoPayment?.commission_rate != null ? Number(saldoPayment.commission_rate) : cobros.comision;
  const comisionChris    = saldoPayment?.commission_amount != null
    ? Number(saldoPayment.commission_amount)
    : comisionPct == null ? null : Math.round(Number(order.total_amount) * comisionPct / 100);
  const recibeAmiga      = Math.max(Number(order.total_amount) - comisionMpTotal - (comisionChris ?? 0), 0);
  const abonoPayment = payments.find((p) => p.type === "abono");
  const saldoApproved = saldoPaid > 0;
  const paintingDone = Boolean(order.painting_done_at);

  const address = [
    [order.street, order.street_number].filter(Boolean).join(" "),
    order.apartment,
  ]
    .filter(Boolean)
    .join(", ");
  const enSucursal = order.delivery_type === "sucursal";

  const timeline = [
    {
      label: "Solicitud recibida",
      icon: Inbox,
      color: "blue",
      done: true,
      date: formatDate(order.created_at),
    },
    {
      label: "Solicitud aceptada",
      icon: ClipboardCheck,
      color: "sky",
      done: ["pendiente_abono", "en_proceso", "finalizado"].includes(order.status),
    },
    {
      label: "Abono recibido",
      icon: Wallet,
      color: "teal",
      done: abonoPaid > 0,
    },
    {
      label: "En proceso",
      icon: Brush,
      color: "amber",
      done: ["en_proceso", "finalizado"].includes(order.status),
    },
    {
      label: "Pintura terminada",
      icon: Frame,
      color: "violet",
      done: paintingDone,
      date: order.painting_done_at && formatDate(order.painting_done_at),
    },
    {
      label: "Saldo pagado",
      icon: CreditCard,
      color: "emerald",
      done: saldoApproved,
    },
    {
      label: "Enviado",
      icon: Truck,
      color: "indigo",
      done: Boolean(order.shipped_at),
      date: order.shipped_at && formatDate(order.shipped_at),
    },
  ];

  const canReject =
    ["solicitud", "pendiente_abono", "en_proceso"].includes(order.status) && !saldoApproved;

  // Tarjeta "Siguiente paso" según la etapa
  let nextStep = null;

  if (order.status === "solicitud") {
    nextStep = (
      <StepCard text="Revisa los datos y las fotos. Si aceptas el trabajo, el cliente podrá pagar el abono y entrará en tu lista de trabajos.">
        <button disabled={saving} onClick={acceptRequest} className={primaryBtn}>
          Aceptar solicitud
        </button>
      </StepCard>
    );
  } else if (order.status === "pendiente_abono") {
    nextStep = (
      <StepCard
        text={`Solicitud aceptada. Esperando el abono de ${money(order.deposit_amount)}. Cuando se confirme el pago, pasará a En proceso.`}
      >
        {abonoPayment?.payment_url && (
          <button
            onClick={() => copyLink(abonoPayment.payment_url)}
            className={secondaryBtn}
          >
            <Copy size={15} />
            {copied ? "Link copiado" : "Copiar link de pago"}
          </button>
        )}
      </StepCard>
    );
  } else if (order.status === "en_proceso" && !paintingDone) {
    nextStep = (
      <StepCard text="Cuando termines la obra, márcala como terminada. Después podrás generar y enviar el cobro del saldo.">
        <button
          disabled={saving}
          onClick={markPaintingDone}
          className={primaryBtn}
        >
          Marcar pintura como terminada
        </button>
      </StepCard>
    );
  } else if (order.status === "en_proceso" && paintingDone && !saldoPayment) {
    nextStep = (
      <StepCard text={`La pintura está terminada. El saldo pendiente es ${money(pending)}. Al generar el enlace se aplicará la comisión de plataforma configurada, calculada sobre el precio total y descontada del saldo.`}>
        <button
          disabled={saving || pending <= 0}
          onClick={() => requestBalance(pending)}
          className={primaryBtn}
        >
          Generar cobro del saldo
        </button>
      </StepCard>
    );
  } else if (order.status === "en_proceso" && !saldoApproved) {
    nextStep = (
      <StepCard
        text={`Esperando el pago del saldo (${money(pending)}).${saldoPayment?.commission_amount != null ? ` Comisión de plataforma registrada: ${money(saldoPayment.commission_amount)} (${saldoPayment.commission_rate}%).` : ""} Cuando el cliente pague, podrás marcar el envío.`}
      >
        {saldoPayment?.payment_url && (
          <button
            onClick={() => copyLink(saldoPayment.payment_url)}
            className={secondaryBtn}
          >
            <Copy size={15} />
            {copied ? "Link copiado" : "Copiar link de pago"}
          </button>
        )}
      </StepCard>
    );
  } else if (order.status === "en_proceso" && saldoApproved) {
    nextStep = (
      <StepCard text="El saldo está pagado. Despacha el cuadro y marca el envío.">
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="Código de seguimiento (opcional)"
          aria-label="Código de seguimiento"
          className="h-11 min-w-0 flex-1 rounded-full border border-white/30 bg-white/95 px-4 text-sm text-tinta outline-none focus:ring-3 focus:ring-white/40 sm:max-w-72"
        />
        <button disabled={saving} onClick={markShipped} className={primaryBtn}>
          Marcar como enviado
        </button>
      </StepCard>
    );
  } else if (order.status === "finalizado") {
    nextStep = (
      <StepCard
        text={`Pedido enviado${order.shipped_at ? ` el ${formatDate(order.shipped_at)}` : ""}.${
          order.tracking_code ? ` Código de seguimiento: ${order.tracking_code}` : ""
        }`}
      />
    );
  }

  return (
    <div>
      <Link
        to="/admin/solicitudes"
        className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full pr-3 text-sm font-medium text-tinta/55 transition hover:text-tinta focus-visible:outline-2 focus-visible:outline-acento"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Solicitudes
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="text-sm text-tinta/50">Recibida el {formatDate(order.created_at)}</span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-tinta md:text-[2.5rem] md:leading-tight">
            {order.pet_name ? `Retrato de ${order.pet_name}` : "Solicitud"}{" "}
            <span className="text-tinta/35">{orderCode(order.order_number)}</span>
          </h1>
          <p className="mt-1.5 text-tinta/60">
            {[order.style, order.size, order.pet_count && `${order.pet_count} ${order.pet_count === 1 ? "mascota" : "mascotas"}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        {canReject && (
          <button
            disabled={saving}
            onClick={() =>
              changeStatus(
                "rechazado",
                abonoPaid > 0
                  ? "El abono no es reembolsable según los términos y condiciones. ¿Rechazar esta solicitud?"
                  : "¿Rechazar esta solicitud? Todavía no hay ningún abono pagado.",
              )
            }
            className={btn.danger}
          >
            <CircleX size={16} aria-hidden="true" /> Rechazar
          </button>
        )}
      </header>

      {nextStep}
      {actionError && (
        <div className="mb-5">
          <Aviso onClose={() => setActionError("")}>{actionError}</Aviso>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <Panel
            title="Fotos de la mascota"
            description={photos.length ? `${photos.length} ${photos.length === 1 ? "foto" : "fotos"} · toca una para verla en grande` : undefined}
          >
            {photos.length === 0 ? (
              <EmptyState compact title="Esta solicitud no tiene fotos" />
            ) : (
              <GaleriaFotos photos={photos} nombre={order.pet_name} />
            )}
          </Panel>

          <Panel title="Detalles de la obra">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Estilo", order.style],
                ["Tamaño", order.size],
                ["Mascotas", order.pet_count],
                ["Nombre", order.pet_name],
                ["Producto", order.product],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-bruma/45 px-4 py-3">
                  <dt className="text-xs text-tinta/50">{k}</dt>
                  <dd className="mt-0.5 font-medium break-words text-tinta">{v || "—"}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 rounded-2xl border border-tinta/8 bg-papel px-5 py-4">
              <p className="flex items-center gap-2 text-xs font-medium text-tinta/50">
                <MessageSquareQuote size={14} aria-hidden="true" /> Indicaciones del cliente
              </p>
              <p className="mt-2 leading-relaxed whitespace-pre-line text-tinta/85">
                {order.description || "El cliente no dejó indicaciones."}
              </p>
            </div>
          </Panel>

          {order.status !== "rechazado" ? (
            <ProgressTracker steps={timeline} />
          ) : (
            <Aviso>
              {abonoPaid > 0
                ? "Este pedido fue rechazado. El abono no es reembolsable."
                : "Este pedido fue rechazado antes de recibir un abono."}
            </Aviso>
          )}
        </div>

        <aside className="space-y-6">
          <Panel title="Cliente">
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-bruma font-semibold text-acento-oscuro">
                {initials(order.customer_name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-tinta">{order.customer_name}</p>
                <a href={`mailto:${order.customer_email}`} className="block truncate text-sm text-acento hover:underline">
                  {order.customer_email}
                </a>
                {order.customer_phone && <p className="text-sm text-tinta/60">{order.customer_phone}</p>}
              </div>
            </div>
          </Panel>

          <Panel title="Envío Starken (por pagar)">
            <dl className="space-y-3 text-sm">
              <Row label="Entrega" value={enSucursal ? "Retiro en sucursal" : "A domicilio"} />
              {enSucursal ? <Row label="Sucursal" value={order.starken_branch} /> : <Row label="Dirección" value={address} />}
              {order.customer_rut && <Row label="RUT" value={order.customer_rut} />}
              <Row label="Comuna" value={order.commune} />
              <Row label="Región" value={order.region} />
            </dl>
          </Panel>

          <Panel title="Resumen financiero">
            <dl className="space-y-3 text-sm">
              <Row label="Precio total" value={money(order.total_amount)} />
              <Row label="Abono a pagar" value={money(order.deposit_amount)} />
              <Row label="Abono pagado" value={money(abonoPaid)} />
              <Row label="Saldo pagado" value={money(saldoPaid)} />
            </dl>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-bruma/50 px-4 py-3">
              <span className="text-sm text-tinta/60">Pendiente</span>
              <strong className="font-display text-2xl text-tinta">{money(pending)}</strong>
            </div>

            {/* Desglose de comisiones */}
            <div className="mt-4 space-y-2 rounded-2xl border border-tinta/8 bg-papel p-4 text-sm">
              <p className="mb-3 text-xs font-medium text-tinta/50">Distribución del cobro</p>

              <div className="flex justify-between gap-3 text-tinta/70">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 shrink-0 rounded-full bg-[#4f8fb0]" />
                  Mercado Pago (aprox. {pct(MP_PORCENTAJE)} × 2 cobros)
                </span>
                <span className="font-medium text-tinta">−{money(comisionMpTotal)}</span>
              </div>
              <div className="-mt-1 space-y-0.5 pl-4 text-xs text-tinta/45">
                <div className="flex justify-between">
                  <span>Abono ({money(abonoRef)})</span>
                  <span>−{money(comisionMpAbono)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Saldo ({money(saldoRef)})</span>
                  <span>−{money(comisionMpSaldo)}</span>
                </div>
              </div>

              <div className="flex justify-between gap-3 border-t border-tinta/8 pt-2 text-tinta/70">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 shrink-0 rounded-full bg-[#8a7bc0]" />
                  Christian ({pct(comisionPct)} del total)
                </span>
                <span className="font-medium text-tinta">{comisionChris == null ? "—" : `−${money(comisionChris)}`}</span>
              </div>

              <div className="flex justify-between gap-3 border-t border-tinta/8 pt-2 font-semibold text-[#2d6844]">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 shrink-0 rounded-full bg-[#5ea67a]" />
                  Recibe tu amiga
                </span>
                <span>{money(recibeAmiga)}</span>
              </div>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

/* Fotos grandes: la primera destacada, el resto en grilla. Visor con flechas y teclado. */
function GaleriaFotos({ photos, nombre }) {
  const [abierta, setAbierta] = useState(null);
  const dialogo = useRef(null);
  const alt = (i) => `Foto ${i + 1} de ${nombre || "la mascota"}`;

  function abrir(i) {
    setAbierta(i);
    dialogo.current?.showModal();
  }
  const mover = (d) => setAbierta((i) => (i + d + photos.length) % photos.length);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((url, i) => (
          <li key={url} className={i === 0 ? "col-span-2 row-span-2" : ""}>
            <button
              type="button"
              onClick={() => abrir(i)}
              className="group relative block w-full overflow-hidden rounded-2xl bg-bruma focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-acento"
            >
              <img
                src={url}
                alt={alt(i)}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute right-2 bottom-2 grid size-9 place-items-center rounded-full bg-white/85 text-tinta opacity-0 shadow transition group-hover:opacity-100 group-focus-visible:opacity-100">
                <ZoomIn size={16} aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogo}
        onClose={() => setAbierta(null)}
        onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") mover(1);
          if (e.key === "ArrowLeft") mover(-1);
        }}
        aria-label="Visor de fotos"
        className="m-auto max-h-[94vh] max-w-[min(94vw,1100px)] overflow-visible bg-transparent p-0 backdrop:bg-tinta/80 backdrop:backdrop-blur-sm"
      >
        {abierta !== null && (
          <figure className="relative">
            <img src={photos[abierta]} alt={alt(abierta)} className="max-h-[84vh] w-auto rounded-2xl object-contain" />
            <figcaption className="mt-3 flex items-center justify-between gap-3 text-sm text-white">
              <span>
                {abierta + 1} de {photos.length}
              </span>
              <span className="flex gap-2">
                {photos.length > 1 && (
                  <>
                    <button type="button" onClick={() => mover(-1)} aria-label="Foto anterior" className="grid size-11 place-items-center rounded-full bg-white/15 hover:bg-white/25">
                      <ChevronLeft size={20} />
                    </button>
                    <button type="button" onClick={() => mover(1)} aria-label="Foto siguiente" className="grid size-11 place-items-center rounded-full bg-white/15 hover:bg-white/25">
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
                <a href={photos[abierta]} target="_blank" rel="noreferrer" aria-label="Abrir original en otra pestaña" className="grid size-11 place-items-center rounded-full bg-white/15 hover:bg-white/25">
                  <ExternalLink size={18} />
                </a>
                <button type="button" onClick={() => dialogo.current.close()} aria-label="Cerrar" className="grid size-11 place-items-center rounded-full bg-white text-tinta">
                  <X size={19} />
                </button>
              </span>
            </figcaption>
          </figure>
        )}
      </dialog>
    </>
  );
}

function ProgressTracker({ steps }) {
  const doneCount = steps.filter((s) => s.done).length;
  const currentIndex = steps.findIndex((s) => !s.done); // primer paso pendiente

  return (
    <Panel
      title="Progreso"
      action={
        <span className="text-sm text-tinta/50">
          {doneCount} de {steps.length} pasos
        </span>
      }
    >
      <ol className="mt-2 flex flex-col md:flex-row">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isCurrent = i === currentIndex;
          const isLast = i === steps.length - 1;

          return (
            <li
              key={step.label}
              aria-current={isCurrent ? "step" : undefined}
              className="relative flex gap-4 pb-7 last:pb-0 md:flex-1 md:flex-col md:items-center md:gap-3 md:pb-0 md:text-center"
            >
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute top-10 bottom-0 left-5 w-0.5 -translate-x-1/2 md:top-5 md:right-auto md:bottom-auto md:left-1/2 md:h-0.5 md:w-full md:translate-x-0 md:-translate-y-1/2 ${
                    step.done ? "bg-acento" : "bg-tinta/10"
                  }`}
                />
              )}

              <span className="relative z-10 shrink-0">
                {isCurrent && <span className="absolute inset-0 rounded-full bg-cielo opacity-50 motion-safe:animate-ping" />}
                <span
                  className={`relative grid size-10 place-items-center rounded-full ${
                    step.done
                      ? "bg-acento text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]"
                      : isCurrent
                        ? "border-2 border-acento bg-white text-acento"
                        : "bg-bruma text-tinta/35"
                  }`}
                >
                  {step.done ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : <Icon size={18} aria-hidden="true" />}
                </span>
              </span>

              <div className="min-w-0 pt-1.5 md:px-1 md:pt-0">
                <p
                  className={`text-sm leading-tight ${
                    step.done ? "font-medium text-tinta" : isCurrent ? "font-semibold text-acento" : "text-tinta/45"
                  }`}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <span className="mt-1 inline-block rounded-full bg-[#e1eef5] px-2 py-0.5 text-[10px] font-semibold text-[#1f5675]">
                    En curso
                  </span>
                )}
                {step.done && step.date && <p className="mt-0.5 text-xs text-tinta/45">{step.date}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

function StepCard({ text, children }) {
  return (
    <section className="mb-6 overflow-hidden rounded-[26px] bg-gradient-to-br from-acento to-acento-oscuro p-6 text-white shadow-[0_24px_44px_-28px_rgb(19_48_61/0.9)]">
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15">
          <Brush size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Siguiente paso</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/80">{text}</p>
          {children && <div className="mt-4 flex flex-wrap items-center gap-3">{children}</div>}
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-tinta/55">{label}</dt>
      <dd className="text-right font-medium text-tinta">{value || "—"}</dd>
    </div>
  );
}
