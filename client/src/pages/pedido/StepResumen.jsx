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
}) {
  const c = datos.contacto;
  const tel = normalizarTelefono(c.telefono);
  const telefono = `+56 ${tel.slice(0, 1)} ${tel.slice(1, 5)} ${tel.slice(5)}`;
  const direccion = `${c.calle} ${c.numero}${c.depto ? `, ${c.depto}` : ""}, ${c.comuna}, ${c.region}`;
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
          <Fila etiqueta="Envío a" valor={direccion} />
        </dl>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f5fafb] px-5 py-4">
        <div>
          <p className="text-sm text-slate-500">Precio del cuadro</p>
          <p className="text-2xl font-semibold text-[#1d4e68]">
            {clp(producto.price)}
          </p>
        </div>
        <p className="max-w-[16rem] text-xs text-slate-500">
          El costo de envío se cotiza al confirmar tu pedido.
        </p>
      </div>

      {aviso && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          {aviso}
        </p>
      )}

      <button
        type="button"
        onClick={onEnviar}
        disabled={enviando}
        className="w-full rounded-full bg-[#2d6583] py-3.5 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar solicitud"}
      </button>
    </div>
  );
}
