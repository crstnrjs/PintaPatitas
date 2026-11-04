import OpcionCard from "./OpcionCard";
import { IconGota, IconImagen, IconPata } from "./iconos";

export const clp = (n) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);

export function StepEstilo({ estilos, seleccionado, onElegir }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {estilos.map((e) => (
        <OpcionCard
          key={e.id}
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
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {formatos.map((f) => (
        <OpcionCard
          key={f.clave}
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

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {productos.map((p) => (
          <OpcionCard
            key={p.id}
            icono={<IconPata />}
            titulo={String(p.pet_count)}
            subtitulo={`${p.pet_count === 1 ? "mascota" : "mascotas"} · ${clp(p.price)}`}
            seleccionada={seleccionado === p.pet_count}
            onClick={() => onElegir(p.pet_count)}
          />
        ))}
      </div>

      {seleccionado != null && (
        <div className="rounded-2xl border border-slate-200 bg-[#f5fafb] p-5">
          <p className="text-sm font-semibold text-[#1d4e68]">
            {seleccionado === 1
              ? "El nombre de tu mascota"
              : "Los nombres de tus mascotas"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Opcional, pero nos ayuda a personalizar tu retrato.
          </p>
          <div className="mt-4 space-y-3">
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
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-[#2d6583] focus:ring-1 focus:ring-[#2d6583]"
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
      <div className="flex flex-wrap gap-2">
        {IDEAS.map((idea) => (
          <button
            key={idea}
            type="button"
            onClick={() => agregar(idea)}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            + {idea.replace(/\.$/, "")}
          </button>
        ))}
      </div>
      <textarea
        rows={7}
        maxLength={MAX}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: fondo azul suave, una aureola sobre la cabeza de mi perro, que se vea con su pañuelo rojo..."
        className="w-full rounded-2xl border border-slate-300 p-4 text-sm outline-none focus:border-[#2d6583] focus:ring-1 focus:ring-[#2d6583]"
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>Es opcional, pero mientras más detalles, mejor.</span>
        <span>
          {valor.length}/{MAX}
        </span>
      </div>
    </div>
  );
}