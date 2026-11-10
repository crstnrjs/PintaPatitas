import { clp } from "./pasos";
import { normalizarTelefono } from "./StepContacto";

/* Bloque del resumen: título corto + contenido. En móvil todo va apilado para que nada se salga. */
function Bloque({ titulo, children }) {
  return (
    <section className="rounded-2xl border border-tinta/10 bg-white p-4 sm:p-5">
      <h2 className="text-xs font-semibold tracking-[0.14em] text-acento uppercase">{titulo}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

// Etiqueta arriba y valor abajo: así los textos largos (correo, dirección) siempre tienen todo el ancho.
function Dato({ etiqueta, valor, ancho = false, cortarEnCualquierParte = false }) {
  return (
    <div className={`min-w-0 ${ancho ? "col-span-full" : ""}`}>
      <dt className="text-xs text-tinta/55">{etiqueta}</dt>
      <dd
        className={`mt-0.5 text-[0.95rem] leading-snug font-medium text-tinta ${
          cortarEnCualquierParte ? "wrap-anywhere" : "wrap-break-word"
        }`}
      >
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
  const idea = datos.idea.trim();
  const cantidadFotos = datos.fotos.length;

  return (
    <div className="space-y-4 sm:space-y-5">
      <Bloque titulo="Tu retrato">
        {cantidadFotos > 0 && (
          <div className="mb-4">
            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {datos.fotos.map((f, i) => (
                <li key={f.id} className="min-w-0">
                  <img
                    src={f.preview}
                    alt={i === 0 ? "Foto de tu mascota" : ""}
                    className="aspect-square w-full rounded-xl object-cover ring-1 ring-tinta/10"
                  />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-tinta/55">
              {cantidadFotos} {cantidadFotos === 1 ? "foto subida" : "fotos subidas"}
            </p>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Dato etiqueta="Estilo" valor={estilo.name} />
          {estilo.has_size && datos.formato && (
            <Dato etiqueta="Formato" valor={datos.formato.etiqueta} />
          )}
          <Dato
            etiqueta="Mascotas"
            valor={`${datos.mascotas} ${datos.mascotas === 1 ? "mascota" : "mascotas"}`}
          />
          {nombresMascotas && (
            <Dato
              ancho
              etiqueta={datos.mascotas === 1 ? "Nombre" : "Nombres"}
              valor={nombresMascotas}
            />
          )}
        </dl>
      </Bloque>

      {idea && (
        <Bloque titulo="Tu idea">
          <p className="border-l-2 border-cielo pl-3 text-sm leading-relaxed whitespace-pre-wrap text-tinta/80 wrap-break-word">
            {idea}
          </p>
        </Bloque>
      )}

      <Bloque titulo="Contacto y envío">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Dato etiqueta="Nombre" valor={`${c.nombre} ${c.apellido}`} />
          <Dato etiqueta="Correo" valor={c.correo} cortarEnCualquierParte />
          <Dato etiqueta="Celular" valor={telefono} />
          <Dato etiqueta="RUT" valor={c.rut} />
          <Dato ancho etiqueta={enSucursal ? "Retiro" : "Envío a"} valor={direccion} />
        </dl>
      </Bloque>

      {producto.foto && (
        <figure className="flex items-center gap-3 rounded-2xl bg-bruma/60 p-3 sm:gap-4">
          <img
            src={producto.foto}
            alt={`Ejemplo de retrato en ${estilo.name}`}
            loading="lazy"
            className="size-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-32"
          />
          <figcaption className="min-w-0 text-[0.8rem] leading-snug text-tinta/70 sm:text-sm">
            <strong className="block font-semibold text-tinta">
              {producto.name ?? `Así lucen nuestros retratos en ${estilo.name}`}
            </strong>
            {datos.formato ? `${datos.formato.etiqueta} · ` : ""}
            Foto de referencia: el tuyo será único, pintado a partir de las fotos de tu mascota.
          </figcaption>
        </figure>
      )}

      <div className="rounded-2xl bg-acento-oscuro px-5 py-4 text-white sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="text-sm text-white/70">Precio del cuadro</p>
          <p className="font-display text-3xl font-semibold tracking-tight">{clp(producto.price)}</p>
        </div>
        <p className="mt-2 text-xs leading-snug text-white/75 sm:mt-0 sm:max-w-[15rem] sm:text-right">
          + envío Starken por pagar: lo pagas al recibir el cuadro.
        </p>
      </div>

      <label
        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm leading-snug transition ${
          datos.aceptaEnvio
            ? "border-acento bg-lino text-tinta"
            : "border-tinta/15 bg-white text-tinta/80 hover:border-tinta/30"
        }`}
      >
        <input
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 accent-acento"
          checked={datos.aceptaEnvio}
          onChange={(e) => onAceptaEnvio(e.target.checked)}
        />
        <span>
          Entiendo que el envío es <strong>por pagar</strong>: el costo de Starken lo pago al recibir el cuadro.
        </span>
      </label>

      {aviso && (
        <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          {aviso}
        </p>
      )}

      <button
        type="button"
        onClick={onEnviar}
        disabled={enviando || !datos.aceptaEnvio}
        className="min-h-13 w-full rounded-full bg-acento px-6 text-base font-semibold text-white shadow-[0_5px_0_-1px_var(--color-acento-oscuro)] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_-1px_var(--color-acento-oscuro)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-tinta disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
      >
        {enviando ? "Enviando..." : "Enviar solicitud"}
      </button>
      <p className="text-center text-xs text-tinta/55">
        Solo pagas si el artista acepta tu solicitud.
      </p>
    </div>
  );
}
