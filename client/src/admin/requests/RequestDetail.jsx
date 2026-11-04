import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Brush,
  Check,
  ClipboardCheck,
  Copy,
  CreditCard,
  Frame,
  Inbox,
  Truck,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { StatusBadge, formatDate, money, orderCode } from "@/admin/shared/ui";
import { apiUrl } from "@/lib/api";

const sumAmount = (list) => list.reduce((acc, p) => acc + p.amount, 0);

const primaryBtn =
  "rounded-full bg-[#214a5d] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

const STEP_STYLES = {
  blue: {
    solid: "bg-blue-500",
    border: "border-blue-500",
    text: "text-blue-600",
    ping: "bg-blue-400",
    line: "bg-blue-500",
    chip: "bg-blue-50 text-blue-700",
  },
  sky: {
    solid: "bg-sky-500",
    border: "border-sky-500",
    text: "text-sky-600",
    ping: "bg-sky-400",
    line: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700",
  },
  teal: {
    solid: "bg-teal-500",
    border: "border-teal-500",
    text: "text-teal-600",
    ping: "bg-teal-400",
    line: "bg-teal-500",
    chip: "bg-teal-50 text-teal-700",
  },
  amber: {
    solid: "bg-amber-500",
    border: "border-amber-500",
    text: "text-amber-600",
    ping: "bg-amber-400",
    line: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700",
  },
  violet: {
    solid: "bg-violet-500",
    border: "border-violet-500",
    text: "text-violet-600",
    ping: "bg-violet-400",
    line: "bg-violet-500",
    chip: "bg-violet-50 text-violet-700",
  },
  emerald: {
    solid: "bg-emerald-500",
    border: "border-emerald-500",
    text: "text-emerald-600",
    ping: "bg-emerald-400",
    line: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700",
  },
  indigo: {
    solid: "bg-indigo-500",
    border: "border-indigo-500",
    text: "text-indigo-600",
    ping: "bg-indigo-400",
    line: "bg-indigo-500",
    chip: "bg-indigo-50 text-indigo-700",
  },
};

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

  if (loading) return <p className="text-sm text-muted-foreground">Cargando...</p>;
  if (error)
    return (
      <div>
        <p className="mb-4 text-sm text-red-600">{error}</p>
        <Link to="/admin/solicitudes" className="text-sm font-semibold text-(--blue)">
          Volver a solicitudes
        </Link>
      </div>
    );

  const approved = payments.filter((p) => p.status === "aprobado");
  const abonoPaid = sumAmount(approved.filter((p) => p.type === "abono"));
  const saldoPaid = sumAmount(approved.filter((p) => p.type === "saldo"));
  const pending = Math.max(order.total_amount - abonoPaid - saldoPaid, 0);

  const saldoPayment = payments.find((p) => p.type === "saldo");
  const abonoPayment = payments.find((p) => p.type === "abono");
  const saldoApproved = saldoPaid > 0;
  const paintingDone = Boolean(order.painting_done_at);

  const address = [
    [order.street, order.street_number].filter(Boolean).join(" "),
    order.apartment,
  ]
    .filter(Boolean)
    .join(", ");

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
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-semibold text-(--deep) transition hover:bg-black/3"
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
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-semibold text-(--deep) transition hover:bg-black/3"
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
          className="h-11 min-w-64 rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-mid"
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
    <div className="max-w-5xl">
      <Link
        to="/admin/solicitudes"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-(--deep)"
      >
        <ArrowLeft size={16} /> Solicitudes
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusBadge status={order.status} />
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-(--deep)">
            Solicitud {orderCode(order.order_number)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {order.customer_name} ·{" "}
            <a href={`mailto:${order.customer_email}`} className="hover:text-(--deep)">
              {order.customer_email}
            </a>
            {order.customer_phone && ` · ${order.customer_phone}`} ·{" "}
            {formatDate(order.created_at)}
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
            className="rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Rechazar
          </button>
        )}
      </header>

      {nextStep}
      {actionError && <p className="mb-4 text-sm text-red-600">{actionError}</p>}

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="mb-4 font-bold text-(--deep)">Detalles de la obra</h2>
          <dl className="space-y-3 text-sm">
            <Row label="Producto" value={order.product} />
            <Row label="Estilo" value={order.style} />
            <Row label="Tamaño" value={order.size} />
            <Row label="Mascotas" value={order.pet_count} />
            <Row label="Mascota" value={order.pet_name} />
            <Row label="Indicaciones" value={order.description} />
          </dl>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="mb-4 font-bold text-(--deep)">Resumen financiero</h2>
          <dl className="space-y-3 text-sm">
            <Row label="Precio total" value={money(order.total_amount)} />
            <Row label="Abono a pagar" value={money(order.deposit_amount)} />
            <Row label="Abono pagado" value={money(abonoPaid)} />
            <Row label="Saldo pagado" value={money(saldoPaid)} />
            <Row label="Pendiente" value={money(pending)} />
          </dl>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-4 font-bold text-(--deep)">Dirección de envío</h2>
        <dl className="space-y-3 text-sm">
          <Row label="Dirección" value={address} />
          <Row label="Comuna" value={order.commune} />
          <Row label="Región" value={order.region} />
        </dl>
      </section>

      <section className="mt-5 rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-4 font-bold text-(--deep)">Fotos de la mascota</h2>
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Esta solicitud no tiene fotos.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img
                  src={url}
                  alt="Foto de la mascota"
                  className="aspect-square w-full rounded-xl object-cover"
                />
              </a>
            ))}
          </div>
        )}
      </section>

      {order.status !== "rechazado" ? (
        <ProgressTracker steps={timeline} />
      ) : (
        <section className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {abonoPaid > 0
            ? "Este pedido fue rechazado. El abono no es reembolsable."
            : "Este pedido fue rechazado antes de recibir un abono."}
        </section>
      )}
    </div>
  );
}

function ProgressTracker({ steps }) {
  const doneCount = steps.filter((s) => s.done).length;
  const currentIndex = steps.findIndex((s) => !s.done); // primer paso pendiente

  return (
    <section className="mt-5 rounded-2xl border border-line bg-white p-6">
      <div className="mb-7 flex items-center justify-between">
        <h2 className="font-bold text-(--deep)">Progreso</h2>
        <span className="text-sm text-muted-foreground">
          {doneCount} de {steps.length} pasos
        </span>
      </div>

      <ol className="flex flex-col md:flex-row">
        {steps.map((step, i) => {
          const c = STEP_STYLES[step.color];
          const Icon = step.icon;
          const isCurrent = i === currentIndex;
          const isLast = i === steps.length - 1;

          return (
            <li
              key={step.label}
              className="relative flex gap-4 pb-8 last:pb-0 md:flex-1 md:flex-col md:items-center md:gap-3 md:pb-0 md:text-center"
            >
              {/* Línea conectora con el siguiente paso */}
              {!isLast && (
                <span
                  className={`absolute top-10 bottom-0 left-5 w-0.5 -translate-x-1/2 md:top-5 md:right-auto md:bottom-auto md:left-1/2 md:h-0.5 md:w-full md:translate-x-0 md:-translate-y-1/2 ${
                    step.done ? c.line : "bg-gray-200"
                  }`}
                />
              )}

              {/* Círculo */}
              <span className="relative z-10 shrink-0">
                {isCurrent && (
                  <span
                    className={`absolute inset-0 rounded-full opacity-40 motion-safe:animate-ping ${c.ping}`}
                  />
                )}
                <span
                  className={`relative grid size-10 place-items-center rounded-full ${
                    step.done
                      ? `${c.solid} text-white`
                      : isCurrent
                        ? `border-2 bg-white ${c.border} ${c.text}`
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {step.done ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                </span>
              </span>

              {/* Texto */}
              <div className="min-w-0 pt-1.5 md:px-2 md:pt-0">
                <p
                  className={`text-sm leading-tight ${
                    step.done
                      ? "font-semibold text-(--ink)"
                      : isCurrent
                        ? `font-bold ${c.text}`
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${c.chip}`}
                  >
                    En curso
                  </span>
                )}
                {step.done && step.date && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.date}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StepCard({ text, children }) {
  return (
    <section className="mb-5 rounded-2xl border border-line bg-white p-6">
      <h2 className="font-bold text-(--deep)">Siguiente paso</h2>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      {children && <div className="mt-4 flex flex-wrap items-center gap-3">{children}</div>}
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-(--ink)">{value || "—"}</dd>
    </div>
  );
}
