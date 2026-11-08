import { useState } from "react";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { REGIONES } from "@/pages/pedido/StepContacto";
import { clp } from "@/pages/pedido/pasos";
import { COMPRA_INICIAL, formatearRut, iniciarCompra, validarCompra } from "./compra";

const enfoque = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta";
const campoBase =
  "mt-1.5 block min-h-12 w-full rounded-2xl border bg-white/90 px-4 text-base text-tinta outline-none transition placeholder:text-tinta/35 focus:ring-3";
const campoOk = "border-tinta/15 focus:border-acento focus:ring-cielo/40";
const campoMal = "border-[#d98a80] focus:border-[#b8483c] focus:ring-[#f3c9c3]";

function Campo({ etiqueta, error, ayuda, className = "", children }) {
  return (
    <label className={`block text-sm font-medium text-tinta ${className}`}>
      {etiqueta}
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-normal text-[#a0392f]">{error}</span>
      ) : (
        ayuda && <span className="mt-1 block text-xs font-normal text-tinta/55">{ayuda}</span>
      )}
    </label>
  );
}

/* Datos del comprador → reserva de 20 minutos → pago en Mercado Pago. */
export default function FormularioCompra({ cuadro, onCancelar }) {
  const [datos, setDatos] = useState(COMPRA_INICIAL);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  const cambiar = (campo) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setDatos((d) => ({ ...d, [campo]: valor }));
    if (errores[campo]) setErrores((er) => ({ ...er, [campo]: undefined }));
  };
  const clase = (campo) => `${campoBase} ${errores[campo] ? campoMal : campoOk}`;
  const sucursal = datos.entrega_tipo === "sucursal";

  async function enviar(e) {
    e.preventDefault();
    setErrorGeneral("");
    const encontrados = validarCompra(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) {
      // Lleva al primer campo con error (útil en celular, donde el formulario es largo).
      const primero = e.currentTarget.querySelector(`[name="${Object.keys(encontrados)[0]}"]`);
      primero?.focus();
      return;
    }
    setEnviando(true);
    try {
      const url = await iniciarCompra(cuadro.slug, datos);
      window.location.assign(url);
    } catch (err) {
      setErrorGeneral(err.message);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4" aria-labelledby="compra-titulo">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="compra-titulo" className="font-display text-2xl text-tinta">Tus datos</h2>
        <button type="button" onClick={onCancelar} className={`min-h-11 rounded-full px-2 text-sm font-medium text-acento hover:text-acento-oscuro ${enfoque}`}>
          Cancelar
        </button>
      </div>

      <Campo etiqueta="Nombre y apellido" error={errores.nombre}>
        <input name="nombre" autoComplete="name" className={clase("nombre")} value={datos.nombre} onChange={cambiar("nombre")} maxLength={120} />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="RUT" error={errores.rut} ayuda="Lo pide Starken para el envío.">
          <input
            name="rut"
            inputMode="text"
            placeholder="12.345.678-5"
            className={clase("rut")}
            value={datos.rut}
            onChange={cambiar("rut")}
            onBlur={() => setDatos((d) => ({ ...d, rut: formatearRut(d.rut) }))}
            maxLength={12}
          />
        </Campo>
        <Campo etiqueta="Celular" error={errores.telefono}>
          <span className="relative block">
            <span className="pointer-events-none absolute top-1/2 left-4 mt-0.75 -translate-y-1/2 text-base text-tinta/50">+56</span>
            <input name="telefono" type="tel" autoComplete="tel-national" placeholder="9 1234 5678" className={`${clase("telefono")} pl-13`} value={datos.telefono} onChange={cambiar("telefono")} maxLength={16} />
          </span>
        </Campo>
      </div>

      <Campo etiqueta="Correo" error={errores.email} ayuda="Aquí te llega la confirmación de la compra.">
        <input name="email" type="email" autoComplete="email" className={clase("email")} value={datos.email} onChange={cambiar("email")} maxLength={120} />
      </Campo>

      <fieldset>
        <legend className="text-sm font-medium text-tinta">¿Cómo lo recibes?</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-2xl bg-bruma/70 p-1">
          {[
            ["domicilio", "A domicilio"],
            ["sucursal", "Sucursal Starken"],
          ].map(([valor, etiqueta]) => (
            <label
              key={valor}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-3 text-center text-sm font-medium transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-tinta ${
                datos.entrega_tipo === valor ? "bg-white text-tinta shadow-sm" : "text-tinta/65 hover:text-tinta"
              }`}
            >
              <input type="radio" name="entrega_tipo" value={valor} checked={datos.entrega_tipo === valor} onChange={cambiar("entrega_tipo")} className="sr-only" />
              {etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Región" error={errores.region}>
          <select name="region" autoComplete="address-level1" className={clase("region")} value={datos.region} onChange={cambiar("region")}>
            <option value="">Elige tu región</option>
            {REGIONES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Comuna" error={errores.comuna}>
          <input name="comuna" autoComplete="address-level2" className={clase("comuna")} value={datos.comuna} onChange={cambiar("comuna")} maxLength={80} />
        </Campo>
      </div>

      <Campo
        etiqueta={sucursal ? "Sucursal Starken" : "Dirección"}
        error={errores.direccion}
        ayuda={sucursal ? "Nombre o dirección de la sucursal donde lo retirarás." : "Calle, número y depto si corresponde."}
      >
        <input
          name="direccion"
          autoComplete={sucursal ? "off" : "street-address"}
          placeholder={sucursal ? "Ej: Starken Viña del Mar Centro" : "Ej: Av. Libertad 123, depto 4"}
          className={clase("direccion")}
          value={datos.direccion}
          onChange={cambiar("direccion")}
          maxLength={200}
        />
      </Campo>

      <label className={`flex items-start gap-3 rounded-2xl p-3 text-sm leading-snug ${errores.acepta_envio ? "bg-[#fbefed] text-[#963a31]" : "bg-white/70 text-tinta/80"}`}>
        <input name="acepta_envio" type="checkbox" className="mt-0.5 size-5 shrink-0 accent-acento" checked={datos.acepta_envio} onChange={cambiar("acepta_envio")} />
        <span>
          Entiendo que el envío es <strong>por pagar</strong>: el costo de Starken lo pago al recibir el cuadro.
        </span>
      </label>

      <dl className="space-y-1.5 border-t border-tinta/10 pt-4 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-tinta/65">Cuadro</dt><dd className="font-medium text-tinta">{clp(cuadro.precio)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-tinta/65">Envío Starken</dt><dd className="font-medium text-tinta">Por pagar al recibir</dd></div>
        <div className="flex justify-between gap-3 pt-1 text-base"><dt className="font-semibold text-tinta">Pagas ahora</dt><dd className="font-display text-2xl text-acento-oscuro">{clp(cuadro.precio)}</dd></div>
      </dl>

      {errorGeneral && (
        <p role="alert" className="rounded-2xl bg-[#fbefed] px-4 py-3 text-sm text-[#963a31]">{errorGeneral}</p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-acento px-7 py-3.5 text-base font-semibold text-white shadow-[0_6px_0_-1px_var(--color-acento-oscuro)] transition hover:-translate-y-0.5 active:translate-y-0.5 disabled:translate-y-0 disabled:opacity-60 ${enfoque}`}
      >
        <LockClosedIcon aria-hidden="true" className="h-5 w-5" />
        {enviando ? "Reservando tu cuadro…" : "Pagar con Mercado Pago"}
      </button>
      <p className="text-center text-xs leading-relaxed text-tinta/55">
        Al continuar, reservamos el cuadro para ti por 20 minutos mientras completas el pago en Mercado Pago.
      </p>
    </form>
  );
}
