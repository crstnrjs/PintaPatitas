import { useRef, useState } from "react";
import { MAX_FOTOS, MAX_ORIGINAL_MB, aWebp } from "./imagenes";
import { IconImagen } from "./iconos";

const TIPOS = ["image/jpeg", "image/png", "image/webp"];
const nuevoId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

export default function StepFotos({ fotos, onAgregar, onQuitar }) {
  const input = useRef(null);
  const [aviso, setAviso] = useState("");
  const [arrastrando, setArrastrando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  async function procesar(lista) {
    const archivos = [...lista];
    const libres = MAX_FOTOS - fotos.length;
    let mensaje = "";
    if (libres <= 0) return setAviso(`Puedes subir hasta ${MAX_FOTOS} fotos.`);
    if (archivos.length > libres) {
      mensaje = `Solo caben ${libres} ${libres === 1 ? "foto más" : "fotos más"} (máximo ${MAX_FOTOS}).`;
    }

    setProcesando(true);
    const nuevas = [];
    for (const file of archivos.slice(0, libres)) {
      if (!TIPOS.includes(file.type)) {
        mensaje = "Solo se aceptan fotos JPG, PNG o WebP.";
        continue;
      }
      if (file.size > MAX_ORIGINAL_MB * 1024 * 1024) {
        mensaje = `Cada foto debe pesar menos de ${MAX_ORIGINAL_MB} MB.`;
        continue;
      }
      try {
        const blob = await aWebp(file);
        nuevas.push({ id: nuevoId(), blob, preview: URL.createObjectURL(blob), nombre: file.name });
      } catch {
        mensaje = "No pudimos leer una de las fotos. Prueba con otra.";
      }
    }
    setProcesando(false);
    if (nuevas.length > 0) onAgregar(nuevas);
    setAviso(mensaje);
  }

  return (
    <div className="space-y-5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          procesar(e.dataTransfer.files);
        }}
        aria-label="Elegir fotos de tu mascota"
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-5 py-8 text-center transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tinta sm:px-6 sm:py-10 ${
          arrastrando ? "border-acento bg-lino" : "border-tinta/20 bg-white hover:border-acento/60 hover:bg-lino/60"
        }`}
      >
        <span aria-hidden="true" className="mb-1 flex size-12 items-center justify-center rounded-full bg-bruma text-acento">
          <IconImagen />
        </span>
        <p className="font-semibold text-pretty text-tinta">
          {procesando ? "Procesando fotos..." : "Arrastra tus fotos aquí o toca para elegirlas"}
        </p>
        <p className="text-sm text-tinta/55">
          JPG, PNG o WebP · hasta {MAX_FOTOS} fotos · {fotos.length}/{MAX_FOTOS} subidas
        </p>
        <input
          ref={input}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            procesar(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {aviso && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{aviso}</p>}

      {fotos.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {fotos.map((f) => (
            <li key={f.id} className="relative aspect-square overflow-hidden rounded-2xl bg-bruma ring-1 ring-tinta/10">
              <img src={f.preview} alt={f.nombre} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onQuitar(f.id)}
                aria-label="Quitar foto"
                className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-white/95 text-lg leading-none text-tinta/70 shadow transition hover:text-red-600 focus-visible:outline-2 focus-visible:outline-tinta"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="rounded-xl bg-bruma/60 p-3 text-xs leading-relaxed text-tinta/70">
        <strong className="font-semibold text-tinta">Mejores resultados:</strong> fotos con buena luz, donde se vea bien la cara y sin filtros. Necesitas al
        menos una foto para continuar.
      </p>
    </div>
  );
}