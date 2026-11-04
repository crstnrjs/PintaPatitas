import { useRef, useState } from "react";
import { MAX_FOTOS, MAX_ORIGINAL_MB, aWebp } from "./imagenes";

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
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          arrastrando ? "border-[#2d6583] bg-[#f5fafb]" : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <p className="font-semibold text-[#1d4e68]">
          {procesando ? "Procesando fotos..." : "Arrastra tus fotos aquí o toca para elegirlas"}
        </p>
        <p className="text-sm text-slate-500">
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
            <li key={f.id} className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
              <img src={f.preview} alt={f.nombre} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onQuitar(f.id)}
                aria-label="Quitar foto"
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-lg leading-none text-slate-600 shadow hover:text-red-600"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500">
        Mejores resultados: fotos con buena luz, donde se vea bien la cara y sin filtros. Necesitas al
        menos una foto para continuar.
      </p>
    </div>
  );
}