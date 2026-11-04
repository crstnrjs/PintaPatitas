import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Link2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

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

      const response = await fetch("/api/oauth/mercadopago/status", {
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

      const response = await fetch("/api/oauth/mercadopago/start", {
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
      <header className="mb-8">
        <span className="text-[11px] font-extrabold tracking-[.12em] text-(--blue) uppercase">
          Configuración
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-(--deep)">
          Mercado Pago Marketplace
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Vincula la cuenta vendedora con OAuth. No compartas su contraseña ni pegues tokens en el navegador o en el chat.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-(--deep)">Cuenta vendedora</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading
                ? "Consultando conexión…"
                : status?.connected
                  ? "La cuenta está vinculada por OAuth."
                  : "Aún no hay una cuenta vendedora vinculada."}
            </p>
            {!loading && status && (
              <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${status.testMode ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-800"}`}>
                {status.testMode ? "Modo de prueba OAuth" : "Modo de producción OAuth"}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={loadStatus}
            disabled={loading || working}
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-(--deep) hover:bg-black/3 disabled:opacity-50"
          >
            <RefreshCw size={15} />
            Actualizar estado
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="mt-6 rounded-xl bg-(--surface) p-4 text-sm leading-6 text-muted-foreground">
          <p className="font-semibold text-(--deep)">Cómo autorizar la cuenta de prueba</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Primero revisa el modo indicado arriba: debe ser de prueba.</li>
            <li>Al continuar, inicia sesión en Mercado Pago con la cuenta vendedora de prueba chilena.</li>
            <li>Revisa que el consentimiento sea para la aplicación Marketplace de PintaPatitas y acepta.</li>
            <li>Mercado Pago volverá aquí y el servidor guardará los tokens sin mostrarlos.</li>
          </ol>
        </div>

        {!loading && <button
          type="button"
          onClick={connectSeller}
          disabled={working || !status?.configured || !status?.testMode}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Link2 size={16} />
          {working
            ? "Abriendo Mercado Pago…"
            : !status?.configured
              ? "Completa la configuración para vincular"
              : status?.connected
                ? "Volver a vincular vendedor de prueba"
                : "Vincular vendedor de prueba"}
          <ExternalLink size={14} />
        </button>}

        {!loading && !status?.configured && (
          <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-bold">Falta completar la configuración privada del servidor.</p>
            <p className="mt-1">En <code>server/.env</code>, completa <code>MP_CLIENT_ID</code> y <code>MP_CLIENT_SECRET</code> con los datos de la aplicación Marketplace. No compartas sus valores.</p>
            {status?.missing?.includes("MP_OAUTH_REDIRECT_URL") && (
              <p className="mt-1">Configura <code>MP_OAUTH_REDIRECT_URL</code> con la misma URL ngrok y ruta <code>/api/oauth/mercadopago/callback</code> que registraste en Developers.</p>
            )}
            {status?.missing?.includes("MP_TOKEN_ENCRYPTION_KEY") && (
              <p className="mt-1">Reinicia el servidor para que se apliquen las variables de entorno requeridas para guardar las credenciales de forma cifrada.</p>
            )}
            {status?.missing?.includes("MP_OAUTH_TEST_TOKEN=true") && (
              <p className="mt-1">El modo de prueba OAuth debe estar activado antes de autorizar una cuenta de prueba.</p>
            )}
            <p className="mt-2 text-xs">Variables pendientes: {status?.missing?.join(", ")}</p>
          </div>
        )}

        {!loading && status?.configured && !status?.testMode && (
          <p className="mt-3 text-sm text-amber-800">
            No se puede iniciar la vinculación de prueba porque el servidor no está en modo de prueba. No autorices una cuenta real desde esta pantalla.
          </p>
        )}
      </section>

      <p className="mt-5 text-xs text-muted-foreground">
        <Link to="/admin/solicitudes" className="font-semibold text-(--blue) hover:underline">
          Volver a solicitudes
        </Link>
      </p>
    </div>
  );
}
