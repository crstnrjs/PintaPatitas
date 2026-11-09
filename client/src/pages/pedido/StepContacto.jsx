import { useState } from "react";
import { formatearRut, rutValido } from "@/lib/rut";

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
  rut: "",
  entrega_tipo: "domicilio",
  region: "",
  comuna: "",
  calle: "",
  numero: "",
  depto: "",
  sucursal: "",
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
  if (!rutValido(c.rut)) e.rut = "Revisa tu RUT";
  if (!c.region) e.region = "Elige tu región";
  if (c.comuna.trim().length < 2) e.comuna = "Ingresa tu comuna";
  if (c.entrega_tipo === "sucursal") {
    if (c.sucursal.trim().length < 3) e.sucursal = "Indica la sucursal Starken";
  } else {
    if (c.calle.trim().length < 2) e.calle = "Ingresa tu calle";
    if (!c.numero.trim()) e.numero = "Ingresa el número";
  }
  return e;
}

// text-base en móvil evita que iOS haga zoom al enfocar el campo
const BASE =
  "mt-1.5 block w-full min-w-0 rounded-xl border bg-white px-3.5 py-3 text-base text-tinta outline-none placeholder:text-tinta/35 focus:ring-1 sm:text-sm";
const OK = "border-tinta/20 focus:border-acento focus:ring-acento";
const MAL = "border-red-400 focus:border-red-400 focus:ring-red-400";

function Campo({ etiqueta, error, className = "", children }) {
  return (
    <label className={`block min-w-0 text-sm font-medium text-tinta/75 ${className}`}>
      {etiqueta}
      {children}
      {error && <span className="mt-1 block text-xs font-normal text-red-600">{error}</span>}
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
    <div className="space-y-5 sm:space-y-6">
      <section className="space-y-4 rounded-2xl border border-tinta/10 bg-white p-4 sm:p-6">
        <h2 className="text-xs font-semibold tracking-[0.14em] text-acento uppercase">Datos personales</h2>
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
              className={`mt-1.5 flex min-w-0 items-center rounded-xl border bg-white focus-within:ring-1 ${
                err("telefono")
                  ? "border-red-400 focus-within:ring-red-400"
                  : "border-tinta/20 focus-within:border-acento focus-within:ring-acento"
              }`}
            >
              <span className="border-r border-tinta/10 py-1 pr-2.5 pl-3.5 text-base font-normal text-tinta/50 sm:text-sm">+56</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="9 1234 5678"
                className="w-full min-w-0 rounded-xl bg-transparent px-3 py-3 text-base text-tinta outline-none placeholder:text-tinta/35 sm:text-sm"
                value={valor.telefono}
                onChange={cambiar("telefono")}
                onBlur={tocar("telefono")}
              />
            </div>
          </Campo>
          <Campo etiqueta="RUT" error={err("rut")}>
            <input
              className={clase("rut")}
              placeholder="12.345.678-5"
              maxLength={12}
              value={valor.rut}
              onChange={cambiar("rut")}
              onBlur={() => {
                onChange({ ...valor, rut: formatearRut(valor.rut) });
                tocar("rut")();
              }}
            />
            {!err("rut") && <span className="mt-1 block text-xs font-normal text-tinta/50">Lo pide Starken para el envío.</span>}
          </Campo>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-tinta/10 bg-white p-4 sm:p-6">
        <div>
          <h2 className="text-xs font-semibold tracking-[0.14em] text-acento uppercase">Envío por Starken</h2>
          <p className="mt-1 text-xs text-tinta/55">
            El envío es por pagar: su costo lo pagas al recibir el cuadro.
          </p>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-tinta/75">¿Cómo lo recibes?</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl bg-bruma/70 p-1">
            {[
              ["domicilio", "A domicilio"],
              ["sucursal", "Sucursal Starken"],
            ].map(([opcion, etiqueta]) => (
              <label
                key={opcion}
                className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-3 text-center text-sm font-medium transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-acento ${
                  valor.entrega_tipo === opcion ? "bg-white text-acento-oscuro shadow-sm" : "text-tinta/60 hover:text-tinta"
                }`}
              >
                <input
                  type="radio"
                  name="entrega_tipo"
                  value={opcion}
                  checked={valor.entrega_tipo === opcion}
                  onChange={cambiar("entrega_tipo")}
                  className="sr-only"
                />
                {etiqueta}
              </label>
            ))}
          </div>
        </fieldset>

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
          {valor.entrega_tipo === "sucursal" ? (
            <Campo etiqueta="Sucursal Starken" error={err("sucursal")} className="sm:col-span-2">
              <input
                className={clase("sucursal")}
                placeholder="Ej: Starken Viña del Mar Centro"
                value={valor.sucursal}
                onChange={cambiar("sucursal")}
                onBlur={tocar("sucursal")}
              />
              {!err("sucursal") && (
                <span className="mt-1 block text-xs font-normal text-tinta/50">Nombre o dirección de la sucursal donde lo retirarás.</span>
              )}
            </Campo>
          ) : (
            <>
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
            </>
          )}
        </div>
      </section>
    </div>
  );
}