import { useState } from "react";

export const REGIONES = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Región Metropolitana de Santiago",
  "Libertador General Bernardo O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén del General Carlos Ibáñez del Campo",
  "Magallanes y de la Antártica Chilena",
];

export const CONTACTO_INICIAL = {
  nombre: "",
  apellido: "",
  correo: "",
  telefono: "",
  region: "",
  comuna: "",
  calle: "",
  numero: "",
  depto: "",
};

// Deja solo los 9 dígitos del celular (quita +56, espacios y guiones)
export function normalizarTelefono(valor) {
  let d = valor.replace(/\D/g, "");
  if (d.startsWith("56")) d = d.slice(2);
  return d;
}

export function validarContacto(c) {
  const e = {};
  if (c.nombre.trim().length < 2) e.nombre = "Ingresa tu nombre";
  if (c.apellido.trim().length < 2) e.apellido = "Ingresa tu apellido";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.correo.trim())) e.correo = "Ingresa un correo válido";
  if (!/^9\d{8}$/.test(normalizarTelefono(c.telefono))) {
    e.telefono = "Ingresa un celular chileno, por ejemplo 9 1234 5678";
  }
  if (!c.region) e.region = "Elige tu región";
  if (c.comuna.trim().length < 2) e.comuna = "Ingresa tu comuna";
  if (c.calle.trim().length < 2) e.calle = "Ingresa tu calle";
  if (!c.numero.trim()) e.numero = "Ingresa el número";
  return e;
}

const BASE = "mt-1 block w-full rounded-xl border bg-white p-3 text-slate-900 outline-none focus:ring-1";
const OK = "border-slate-300 focus:border-[#2d6583] focus:ring-[#2d6583]";
const MAL = "border-red-400 focus:border-red-400 focus:ring-red-400";

function Campo({ etiqueta, error, className = "", children }) {
  return (
    <label className={`block text-sm text-slate-600 ${className}`}>
      {etiqueta}
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export default function StepContacto({ valor, onChange }) {
  const [tocados, setTocados] = useState({});
  const errores = validarContacto(valor);

  const cambiar = (campo) => (e) => onChange({ ...valor, [campo]: e.target.value });
  const tocar = (campo) => () => setTocados((t) => ({ ...t, [campo]: true }));
  const err = (campo) => (tocados[campo] ? errores[campo] : "");
  const clase = (campo) => `${BASE} ${err(campo) ? MAL : OK}`;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-semibold text-[#1d4e68]">Tus datos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre" error={err("nombre")}>
            <input
              className={clase("nombre")}
              autoComplete="given-name"
              value={valor.nombre}
              onChange={cambiar("nombre")}
              onBlur={tocar("nombre")}
            />
          </Campo>
          <Campo etiqueta="Apellido" error={err("apellido")}>
            <input
              className={clase("apellido")}
              autoComplete="family-name"
              value={valor.apellido}
              onChange={cambiar("apellido")}
              onBlur={tocar("apellido")}
            />
          </Campo>
          <Campo etiqueta="Correo electrónico" error={err("correo")}>
            <input
              type="email"
              className={clase("correo")}
              autoComplete="email"
              value={valor.correo}
              onChange={cambiar("correo")}
              onBlur={tocar("correo")}
            />
          </Campo>
          <Campo etiqueta="Celular" error={err("telefono")}>
            <div
              className={`mt-1 flex items-center rounded-xl border bg-white focus-within:ring-1 ${
                err("telefono")
                  ? "border-red-400 focus-within:ring-red-400"
                  : "border-slate-300 focus-within:border-[#2d6583] focus-within:ring-[#2d6583]"
              }`}
            >
              <span className="pl-3 text-slate-400">+56</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="9 1234 5678"
                className="w-full rounded-xl bg-transparent p-3 text-slate-900 outline-none"
                value={valor.telefono}
                onChange={cambiar("telefono")}
                onBlur={tocar("telefono")}
              />
            </div>
          </Campo>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-[#1d4e68]">Dirección de envío</h2>
          <p className="text-xs text-slate-500">
            El costo de envío se cotiza al confirmar tu pedido.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Región" error={err("region")}>
            <select
              className={clase("region")}
              value={valor.region}
              onChange={cambiar("region")}
              onBlur={tocar("region")}
            >
              <option value="">Elige tu región</option>
              {REGIONES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Comuna" error={err("comuna")}>
            <input
              className={clase("comuna")}
              value={valor.comuna}
              onChange={cambiar("comuna")}
              onBlur={tocar("comuna")}
            />
          </Campo>
          <Campo etiqueta="Calle" error={err("calle")} className="sm:col-span-2">
            <input
              className={clase("calle")}
              autoComplete="address-line1"
              value={valor.calle}
              onChange={cambiar("calle")}
              onBlur={tocar("calle")}
            />
          </Campo>
          <Campo etiqueta="Número" error={err("numero")}>
            <input
              className={clase("numero")}
              value={valor.numero}
              onChange={cambiar("numero")}
              onBlur={tocar("numero")}
            />
          </Campo>
          <Campo etiqueta="Depto / casa (opcional)">
            <input className={`${BASE} ${OK}`} value={valor.depto} onChange={cambiar("depto")} />
          </Campo>
        </div>
      </section>
    </div>
  );
}