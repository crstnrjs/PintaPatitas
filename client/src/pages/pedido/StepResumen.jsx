import { clp } from "./pasos";
import { normalizarTelefono } from "./StepContacto";

function Fila({ etiqueta, valor }) {
  return (
    <div className="flex gap-4 py-2.5">
      <dt className="w-24 shrink-0 text-slate-500">{etiqueta}</dt>
      <dd className="min-w-0 whitespace-pre-wrap wrap-break-words text-slate-900">
        {valor}
      </dd>
    </div>
  );
}
export default function StepResumen({
  datos,
  estilo,
  producto,
  onEnviar,
  enviando,
  aviso,
  onAceptaEnvio,
}) {
  const c = datos.contacto;
  const tel = normalizarTelefono(c.telefono);
  const telefono = `+56 ${tel.slice(0, 1)} ${tel.slice(1, 5)} ${tel.slice(5)}`;
  const enSucursal = c.entrega_tipo === "sucursal";
  const direccion = enSucursal
    ? `Retiro en sucursal Starken: ${c.sucursal.trim()}, ${c.comuna}, ${c.region}`
    : `${c.calle} ${c.numero}${c.depto ? `, ${c.depto}` : ""}, ${c.comuna}, ${c.region}`;
  const nombresMascotas = (datos.nombres ?? [])
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(", ");
  const [principal, ...otras] = datos.fotos;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 rounded-3xl border border-slate-200 p-4 sm:grid-cols-[220px_1fr] sm:p-6">
        <div>
          {principal && (
            <img
              src={principal.preview}
              alt="Foto de tu mascota"
              className="aspect-4/5 w-full rounded-2xl object-cover"
            />
          )}
          {otras.length > 0 && (
            <div className="mt-2 flex gap-2">
              {otras.slice(0, 4).map((f) => (
                <img
                  key={f.id}
                  src={f.preview}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-slate-500">
            {datos.fotos.length} {datos.fotos.length === 1 ? "foto" : "fotos"}
          </p>
        </div>

        <dl className="divide-y divide-slate-100 text-sm">
          <Fila etiqueta="Estilo" valor={estilo.name} />
          {estilo.has_size && datos.formato && (
            <Fila etiqueta="Formato" valor={datos.formato.etiqueta} />
          )}
          <Fila etiqueta="Mascotas" valor={datos.mascotas} />
          {nombresMascotas && (
            <Fila
              etiqueta={datos.mascotas === 1 ? "Mascota" : "Mascotas"}
              valor={nombresMascotas}
            />
          )}
          {datos.idea.trim() && (
            <Fila etiqueta="Tu idea" valor={datos.idea.trim()} />
          )}
          <Fila etiqueta="Nombre" valor={`${c.nombre} ${c.apellido}`} />
          <Fila etiqueta="Correo" valor={c.correo} />
          <Fila etiqueta="Celular" valor={telefono} />
          <Fila etiqueta="RUT" valor={c.rut} />
          <Fila etiqueta={enSucursal ? "Retiro" : "Envío a"} valor={direccion} />
        </dl>
      </div>

      {producto.foto && (
        <figure className="flex items-center gap-4 rounded-2xl border border-slate-200 p-3">
          <img
            src={producto.foto}
            alt={`Ejemplo de retrato en ${estilo.name}`}
            loading="lazy"
            className="h-20 w-24 shrink-0 rounded-xl object-cover sm:h-24 sm:w-32"
          />
          <figcaption className="text-sm leading-snug text-slate-600">
            <strong className="block font-semibold text-slate-900">Así lucen nuestros retratos en {estilo.name}</strong>
            {datos.formato ? `${datos.formato.etiqueta} · ` : ""}
            Foto de referencia: el tuyo será único, pintado a partir de las fotos de tu mascota.
          </figcaption>
        </figure>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f5fafb] px-5 py-4">
        <div>
          <p className="text-sm text-slate-500">Precio del cuadro</p>
          <p className="text-2xl font-semibold text-[#1d4e68]">
            {clp(producto.price)}
          </p>
        </div>
        <p className="max-w-[16rem] text-xs text-slate-500">
          + envío Starken por pagar: lo pagas al recibir el cuadro.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm leading-snug text-slate-700">
        <input
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 accent-[#2d6583]"
          checked={datos.aceptaEnvio}
          onChange={(e) => onAceptaEnvio(e.target.checked)}
        />
        <span>
          Entiendo que el envío es <strong>por pagar</strong>: el costo de Starken lo pago al recibir el cuadro.
        </span>
      </label>

      {aviso && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          {aviso}
        </p>
      )}

      <button
        type="button"
        onClick={onEnviar}
        disabled={enviando || !datos.aceptaEnvio}
        className="w-full rounded-full bg-[#2d6583] py-3.5 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar solicitud"}
      </button>
    </div>
  );
}
