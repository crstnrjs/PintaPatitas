import OpcionCard from "./OpcionCard";
import { IconGota, IconImagen, IconPata } from "./iconos";

export const clp = (n) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);

// Si al menos una opción tiene foto en el catálogo, todas se muestran como tarjetas con foto.
const algunaFoto = (opciones) => opciones.some((o) => o.foto);
// Con fotos, dos columnas incluso en móvil (tarjetas compactas); sin fotos, una fila por opción.
const grilla = (conFoto) => (conFoto ? "grid grid-cols-2 gap-3 sm:gap-4" : "grid gap-3 sm:grid-cols-2");

export function StepEstilo({ estilos, seleccionado, onElegir }) {
  const conFoto = algunaFoto(estilos);
  return (
    <div className={grilla(conFoto)}>
      {estilos.map((e) => (
        <OpcionCard
          key={e.id}
          conFoto={conFoto}
          foto={e.foto}
          icono={<IconGota />}
          titulo={e.name}
          subtitulo={`Desde ${clp(e.desde)}`}
          seleccionada={seleccionado === e.id}
          onClick={() => onElegir(e.id)}
        />
      ))}
    </div>
  );
}

export function StepFormato({ formatos, seleccionado, onElegir }) {
  const conFoto = algunaFoto(formatos);
  return (
    <div className={grilla(conFoto)}>
      {formatos.map((f) => (
        <OpcionCard
          key={f.clave}
          conFoto={conFoto}
          foto={f.foto}
          icono={<IconImagen />}
          titulo={f.etiqueta}
          subtitulo={`Desde ${clp(f.desde)}`}
          seleccionada={seleccionado?.clave === f.clave}
          onClick={() => onElegir(f)}
        />
      ))}
    </div>
  );
}

export function StepMascotas({
  productos,
  seleccionado,
  nombres = [],
  onElegir,
  onNombres,
}) {
  function cambiarNombre(i, valor) {
    const nuevos = [...nombres];
    nuevos[i] = valor;
    onNombres(nuevos);
  }

  const conFoto = algunaFoto(productos);
  return (
    <div className="space-y-6">
      <div className={grilla(conFoto)}>
        {productos.map((p) => (
          <OpcionCard
            key={p.id}
            conFoto={conFoto}
            foto={p.foto}
            nombre={p.name}
            icono={<IconPata />}
            titulo={`${p.pet_count} ${p.pet_count === 1 ? "mascota" : "mascotas"}`}
            subtitulo={clp(p.price)}
            seleccionada={seleccionado === p.pet_count}
            onClick={() => onElegir(p.pet_count)}
          />
        ))}
      </div>

      {seleccionado != null && (
        <div className="rounded-2xl border border-tinta/10 bg-white p-4 sm:p-5">
          <p className="text-sm font-semibold text-tinta">
            {seleccionado === 1
              ? "El nombre de tu mascota"
              : "Los nombres de tus mascotas"}
          </p>
          <p className="mt-1 text-xs text-tinta/55">
            Opcional, pero nos ayuda a personalizar tu retrato.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: seleccionado }).map((_, i) => (
              <input
                key={i}
                type="text"
                value={nombres[i] ?? ""}
                onChange={(e) => cambiarNombre(i, e.target.value)}
                maxLength={40}
                placeholder={
                  seleccionado === 1
                    ? "Ej: Luna"
                    : `Ej: nombre de la mascota ${i + 1}`
                }
                aria-label={seleccionado === 1 ? "Nombre de tu mascota" : `Nombre de la mascota ${i + 1}`}
                className="w-full rounded-xl border border-tinta/20 bg-white px-3.5 py-3 text-base text-tinta outline-none placeholder:text-tinta/35 focus:border-acento focus:ring-1 focus:ring-acento sm:text-sm"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const IDEAS = [
  "Fondo de color o paisaje.",
  "Una aureola sobre su cabeza.",
  "Con su ropa o accesorio favorito.",
  "Mirando de frente.",
  "Mirando de perfil.",
];
const MAX = 800;

export function StepIdea({ valor, onChange }) {
  function agregar(frase) {
    if (valor.includes(frase)) return;
    const nuevo = valor ? `${valor.trimEnd()} ${frase}` : frase;
    onChange(nuevo.slice(0, MAX));
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-tinta/60">Toca una idea para sumarla:</p>
      <div className="-mt-1 flex flex-wrap gap-2">
        {IDEAS.map((idea) => (
          <button
            key={idea}
            type="button"
            onClick={() => agregar(idea)}
            className={`min-h-9 rounded-full border px-3.5 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta ${
              valor.includes(idea)
                ? "border-acento bg-lino text-acento-oscuro"
                : "border-tinta/15 bg-white text-tinta/70 hover:border-tinta/35 hover:text-tinta"
            }`}
          >
            + {idea.replace(/\.$/, "")}
          </button>
        ))}
      </div>
      <textarea
        rows={6}
        aria-label="Cómo imaginas tu pintura"
        maxLength={MAX}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: fondo azul suave, una aureola sobre la cabeza de mi perro, que se vea con su pañuelo rojo..."
        className="w-full resize-y rounded-2xl border border-tinta/20 bg-white p-4 text-base leading-relaxed text-tinta outline-none placeholder:text-tinta/35 focus:border-acento focus:ring-1 focus:ring-acento sm:text-sm"
      />
      <div className="flex justify-between gap-4 text-xs text-tinta/55">
        <span>Es opcional, pero mientras más detalles, mejor.</span>
        <span className="shrink-0 tabular-nums">
          {valor.length}/{MAX}
        </span>
      </div>
    </div>
  );
}