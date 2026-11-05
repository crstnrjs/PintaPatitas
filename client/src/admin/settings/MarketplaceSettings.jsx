import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Link2, RefreshCw, WalletCards } from "lucide-react";
import { PageHeader, btn } from "@/admin/shared/ui";
import { supabase } from "@/lib/supabase";
import { apiUrl } from "@/lib/api";

export default function MarketplaceSettings() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function loadStatus() {
    setLoading(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Tu sesión de administrador venció. Vuelve a iniciar sesión.");

      const response = await fetch(apiUrl("/api/oauth/mercadopago/status"), {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "No se pudo consultar el estado de la conexión.");
      setStatus(result);
    } catch (err) {
      setError(err.message || "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function connectSeller() {
    setWorking(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Tu sesión de administrador venció. Vuelve a iniciar sesión.");

      const response = await fetch(apiUrl("/api/oauth/mercadopago/start"), {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const missing = result.missing?.length ? ` Variables faltantes: ${result.missing.join(", ")}.` : "";
        throw new Error((result.error || "No se pudo iniciar OAuth.") + missing);
      }

      window.location.assign(result.authorization_url);
    } catch (err) {
      setError(err.message || "No se pudo iniciar la autorización.");
      setWorking(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Mercado Pago"
        description="Vincula la cuenta vendedora con OAuth. No compartas su contraseña ni pegues tokens en el navegador o en el chat."
      />

      <section className="rounded-[26px] border border-white/80 bg-white/85 p-6 shadow-[0_18px_40px_-30px_rgb(19_48_61/0.5)] md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-3 text-lg font-semibold text-tinta">
              <span className="grid size-10 place-items-center rounded-full bg-[#e1eef5] text-[#1f5675]"><WalletCards size={18} aria-hidden="true" /></span>
              Cuenta vendedora
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading
                ? "Consultando conexión…"
                : status?.modeMismatch
                  ? `Credencial guardada es ${status.sellerMode === "live" ? "live" : "de prueba"}, pero el servidor está en modo ${status.testMode ? "de prueba" : "live"}.`
                  : status?.connected
                    ? "La cuenta está vinculada por OAuth."
                    : "Aún no hay una cuenta vendedora vinculada."}
            </p>
            {!loading && status && (
              <>
                <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${status.testMode ? "bg-[#faefd9] text-[#865710]" : "bg-[#e1f0e6] text-[#2d6844]"}`}>
                  {status.testMode ? "Modo de prueba OAuth" : "Modo de producción OAuth"}
                </span>
                {status.modeMismatch && (
                  <p className="mt-2 text-xs text-[#963a31]">
                    Desajuste detectado. Reconecta para usar el modo actual.
                  </p>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={loadStatus}
            disabled={loading || working}
            className={btn.secondary}
          >
            <RefreshCw size={15} />
            Actualizar estado
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-2xl border border-[#ecc8c2] bg-[#fbefed] p-4 text-sm text-[#963a31]">
            {error}
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-tinta/8 bg-papel p-5 text-sm leading-6 text-tinta/65">
          <p className="font-semibold text-(--deep)">Cómo autorizar la cuenta vendedora</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Primero revisa el modo indicado arriba. En producción, debe ser live; en pruebas, debe ser de prueba.</li>
            <li>Al continuar, inicia sesión con una cuenta vendedora de Mercado Pago que corresponda al modo indicado.</li>
            <li>Revisa que el consentimiento sea para la aplicación Marketplace de PintaPatitas y acepta.</li>
            <li>Mercado Pago volverá aquí y el servidor guardará los tokens sin mostrarlos; rechazará credenciales de un modo distinto.</li>
          </ol>
          {!loading && status && !status.testMode && (
            <p className="mt-4 rounded-xl border border-[#ecc8c2] bg-[#fbefed] p-3 text-xs text-[#963a31]">
              <strong>Advertencia:</strong> Estás en modo live. Al autorizar conectarás una cuenta real de Mercado Pago. Este paso solo autoriza la plataforma; no crea cobros.
            </p>
          )}
        </div>

        {!loading && <button
          type="button"
          onClick={connectSeller}
          disabled={working || !status?.configured}
          className={`mt-6 ${btn.primary}`}
        >
          <Link2 size={16} />
          {working
            ? "Abriendo Mercado Pago…"
            : !status?.configured
              ? "Completa la configuración para vincular"
              : status?.modeMismatch
                ? `Reconectar vendedor ${status.testMode ? "de prueba" : "live"}`
                : status?.connected
                  ? `Volver a vincular vendedor ${status.testMode ? "de prueba" : "live"}`
                  : `Vincular vendedor ${status.testMode ? "de prueba" : "live"}`}
          <ExternalLink size={14} />
        </button>}

        {!loading && !status?.configured && (
          <div role="alert" className="mt-5 rounded-2xl border border-[#efd9ae] bg-[#fdf6e8] p-4 text-sm text-[#6b450c]">
            <p className="font-bold">Falta completar la configuración privada del servidor.</p>
            <p className="mt-1">En <code>server/.env</code>, completa <code>MP_CLIENT_ID</code> y <code>MP_CLIENT_SECRET</code> con los datos de la aplicación Marketplace. No compartas sus valores.</p>
            {status?.missing?.includes("MP_OAUTH_REDIRECT_URL") && (
              <p className="mt-1">Configura <code>MP_OAUTH_REDIRECT_URL</code> con la misma URL ngrok y ruta <code>/api/oauth/mercadopago/callback</code> que registraste en Developers.</p>
            )}
            {status?.missing?.includes("MP_TOKEN_ENCRYPTION_KEY") && (
              <p className="mt-1">Reinicia el servidor para que se apliquen las variables de entorno requeridas para guardar las credenciales de forma cifrada.</p>
            )}
            <p className="mt-2 text-xs">Variables pendientes: {status?.missing?.join(", ")}</p>
          </div>
        )}

      </section>

      <p className="mt-5 text-xs text-muted-foreground">
        <Link to="/admin/solicitudes" className="font-semibold text-acento hover:underline">
          Volver a solicitudes
        </Link>
      </p>
    </div>
  );
}
