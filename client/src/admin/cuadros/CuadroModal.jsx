import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Aviso, btn, inputClass, modalOverlay, modalPanel } from "@/admin/shared/ui";
import { BUCKET, crearSlug, estadoEfectivo, filtroSinCompraEnCurso, fotoUrl, procesarFoto } from "./estados";

const MAX_FOTOS = 8;
const PRECIO_MAXIMO = 50_000_000; // igual que el check de la tabla

const texto = (v) => (v == null ? "" : String(v));
// Campo numérico opcional: vacío → null; acepta coma decimal.
const numeroOpcional = (v) => {
  const limpio = String(v).trim().replace(",", ".");
  return limpio === "" ? null : Number(limpio);
};

function Campo({ label, ayuda, children, className = "" }) {
  return (
    <label className={`block text-sm font-medium text-tinta ${className}`}>
      {label}
      {children}
      {ayuda && <span className="mt-1 block text-xs font-normal text-tinta/55">{ayuda}</span>}
    </label>
  );
}

// cuadro = null → crear; objeto → editar
export default function CuadroModal({ cuadro, tecnicas, onClose, onSaved, onConflicto }) {
  const editando = Boolean(cuadro);
  const [titulo, setTitulo] = useState(cuadro?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(cuadro?.descripcion ?? "");
  const [tecnicaId, setTecnicaId] = useState(cuadro?.technique_id ?? "");
  const [ancho, setAncho] = useState(texto(cuadro?.ancho_cm));
  const [alto, setAlto] = useState(texto(cuadro?.alto_cm));
  const [precio, setPrecio] = useState(texto(cuadro?.precio));
  const [peso, setPeso] = useState(texto(cuadro?.peso_embalado_kg));
  const [embLargo, setEmbLargo] = useState(texto(cuadro?.embalaje_largo_cm));
  const [embAncho, setEmbAncho] = useState(texto(cuadro?.embalaje_ancho_cm));
  const [embAlto, setEmbAlto] = useState(texto(cuadro?.embalaje_alto_cm));
  const [publicar, setPublicar] = useState(false);
  // Cada foto: { path } si ya está en Storage, o { blob, preview } si es nueva.
  const [fotos, setFotos] = useState(() => (cuadro?.fotos ?? []).map((path) => ({ path })));
  const [procesando, setProcesando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const inputFotos = useRef(null);
  const previews = useRef(new Set());

  const tecnicasVisibles = tecnicas.filter((t) => t.is_active || t.id === cuadro?.technique_id);

  // Libera las vistas previas al cerrar.
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !guardando && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guardando, onClose]);

  async function agregarFotos(e) {
    const elegidas = [...e.target.files];
    e.target.value = "";
    if (!elegidas.length) return;
    if (fotos.length + elegidas.length > MAX_FOTOS) return setError(`Puedes subir hasta ${MAX_FOTOS} fotos por cuadro.`);
    setError("");
    setProcesando(true);
    try {
      const nuevas = await Promise.all(
        elegidas.map(async (file) => {
          const blob = await procesarFoto(file);
          const preview = URL.createObjectURL(blob);
          previews.current.add(preview);
          return { blob, preview };
        }),
      );
      setFotos((actuales) => [...actuales, ...nuevas]);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  function mover(indice, delta) {
    setFotos((actuales) => {
      const destino = indice + delta;
      if (destino < 0 || destino >= actuales.length) return actuales;
      const copia = [...actuales];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  }

  const quitar = (indice) => setFotos((actuales) => actuales.filter((_, i) => i !== indice));

  function validar() {
    if (!titulo.trim()) return "Escribe un título para el cuadro.";
    const valorPrecio = Number(String(precio).replace(/\./g, "").trim());
    if (!Number.isInteger(valorPrecio) || valorPrecio <= 0) return "El precio debe ser un número entero mayor a 0, sin decimales.";
    if (valorPrecio > PRECIO_MAXIMO) return "El precio parece demasiado alto. Revisa que no tenga dígitos de más.";
    const numeros = { "El ancho": ancho, "El alto": alto, "El peso": peso, "El largo del embalaje": embLargo, "El ancho del embalaje": embAncho, "El alto del embalaje": embAlto };
    for (const [nombre, valor] of Object.entries(numeros)) {
      const n = numeroOpcional(valor);
      if (n !== null && (!Number.isFinite(n) || n <= 0)) return `${nombre} debe ser un número mayor a 0.`;
    }
    if ((numeroOpcional(ancho) === null) !== (numeroOpcional(alto) === null)) return "Completa el ancho y el alto del cuadro, o deja ambos vacíos.";
    const estado = cuadro ? estadoEfectivo(cuadro) : publicar ? "disponible" : "borrador";
    if (estado === "disponible" && fotos.length === 0) return "Un cuadro publicado necesita al menos una foto.";
    return null;
  }

  async function guardar(e) {
    e.preventDefault();
    const problema = validar();
    if (problema) return setError(problema);
    setError("");
    setGuardando(true);

    const subidas = [];
    try {
      const rutas = [];
      for (const foto of fotos) {
        if (foto.path) {
          rutas.push(foto.path);
          continue;
        }
        const path = `${crypto.randomUUID()}.webp`;
        const { error: errSubida } = await supabase.storage
          .from(BUCKET)
          .upload(path, foto.blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (errSubida) throw errSubida;
        subidas.push(path);
        rutas.push(path);
      }

      const datos = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        technique_id: tecnicaId || null,
        ancho_cm: numeroOpcional(ancho),
        alto_cm: numeroOpcional(alto),
        precio: Number(String(precio).replace(/\./g, "").trim()),
        fotos: rutas,
        peso_embalado_kg: numeroOpcional(peso),
        embalaje_largo_cm: numeroOpcional(embLargo),
        embalaje_ancho_cm: numeroOpcional(embAncho),
        embalaje_alto_cm: numeroOpcional(embAlto),
      };

      if (editando) {
        // Solo se edita si nadie lo está comprando y no se vendió mientras tanto.
        const { data, error: errUpdate } = await supabase
          .from("cuadros_listos")
          .update(datos)
          .eq("id", cuadro.id)
          .or(filtroSinCompraEnCurso(["borrador", "disponible", "oculto"]))
          .select("id");
        if (errUpdate) throw errUpdate;
        if (!data?.length) {
          if (subidas.length) await supabase.storage.from(BUCKET).remove(subidas);
          return onConflicto();
        }
        const descartadas = (cuadro.fotos ?? []).filter((p) => !rutas.includes(p));
        if (descartadas.length) await supabase.storage.from(BUCKET).remove(descartadas);
        return onSaved("Cuadro actualizado");
      }

      const fila = { ...datos, estado: publicar ? "disponible" : "borrador" };
      let { error: errInsert } = await supabase.from("cuadros_listos").insert({ ...fila, slug: crearSlug(fila.titulo) });
      // Choque improbable de slug: se reintenta una vez con otro sufijo.
      if (errInsert?.code === "23505") {
        ({ error: errInsert } = await supabase.from("cuadros_listos").insert({ ...fila, slug: crearSlug(fila.titulo) }));
      }
      if (errInsert) throw errInsert;
      onSaved(publicar ? "Cuadro publicado en la tienda" : "Cuadro guardado como borrador");
    } catch (err) {
      if (subidas.length) await supabase.storage.from(BUCKET).remove(subidas);
      setError(`No se pudo guardar el cuadro: ${err.message}`);
      setGuardando(false);
    }
  }

  return (
    <div className={modalOverlay} role="dialog" aria-modal="true" aria-labelledby="cuadro-modal-titulo">
      <form onSubmit={guardar} className={`${modalPanel} max-h-[94vh] max-w-2xl space-y-6 overflow-y-auto p-5 sm:p-6`}>
        <div className="flex items-center justify-between gap-3">
          <h2 id="cuadro-modal-titulo" className="font-display text-2xl text-tinta">
            {editando ? "Editar cuadro" : "Nuevo cuadro listo"}
          </h2>
          <button type="button" className={btn.ghost} onClick={onClose} disabled={guardando} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {error && <Aviso onClose={() => setError("")}>{error}</Aviso>}

        <section className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-semibold text-tinta">Fotos</h3>
            <span className="text-xs text-tinta/55">{fotos.length}/{MAX_FOTOS} · la primera es la portada</span>
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {fotos.map((foto, i) => (
              <li key={foto.path ?? foto.preview} className="group relative">
                <img
                  src={foto.path ? fotoUrl(foto.path) : foto.preview}
                  alt={`Foto ${i + 1}`}
                  className={`aspect-square w-full rounded-xl object-cover ${i === 0 ? "ring-2 ring-acento" : ""}`}
                />
                {i === 0 && (
                  <span className="absolute top-1 left-1 rounded-full bg-acento px-2 py-0.5 text-[10px] font-semibold text-white">Portada</span>
                )}
                <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
                  <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`Mover foto ${i + 1} a la izquierda`} className="grid size-7 place-items-center rounded-full bg-white/90 text-tinta disabled:opacity-30">
                    <ArrowLeft size={14} />
                  </button>
                  <button type="button" onClick={() => quitar(i)} aria-label={`Quitar foto ${i + 1}`} className="grid size-7 place-items-center rounded-full bg-white/90 text-[#963a31]">
                    <X size={14} />
                  </button>
                  <button type="button" onClick={() => mover(i, 1)} disabled={i === fotos.length - 1} aria-label={`Mover foto ${i + 1} a la derecha`} className="grid size-7 place-items-center rounded-full bg-white/90 text-tinta disabled:opacity-30">
                    <ArrowRight size={14} />
                  </button>
                </div>
              </li>
            ))}
            {fotos.length < MAX_FOTOS && (
              <li>
                <button
                  type="button"
                  onClick={() => inputFotos.current?.click()}
                  disabled={procesando}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-tinta/25 text-xs text-tinta/60 transition hover:border-acento hover:text-acento disabled:opacity-50"
                >
                  <ImagePlus size={20} aria-hidden="true" />
                  {procesando ? "Procesando…" : "Agregar fotos"}
                </button>
              </li>
            )}
          </ul>
          <input ref={inputFotos} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={agregarFotos} />
        </section>

        <section className="space-y-4">
          <Campo label="Título">
            <input className={`${inputClass} mt-1.5`} value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={120} required placeholder="Ej: Gato al atardecer" />
          </Campo>
          <Campo label="Descripción (opcional)" ayuda="Cuéntale al comprador sobre la obra: materiales, inspiración, si va enmarcada.">
            <textarea className={`${inputClass} mt-1.5 h-24 py-3`} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={2000} />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Técnica (opcional)">
              <select className={`${inputClass} mt-1.5`} value={tecnicaId} onChange={(e) => setTecnicaId(e.target.value)}>
                <option value="">Sin técnica</option>
                {tecnicasVisibles.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Campo>
            <Campo label="Precio (CLP)" ayuda="Solo el cuadro. El envío por Starken lo paga el cliente al recibir.">
              <input className={`${inputClass} mt-1.5`} inputMode="numeric" value={precio} onChange={(e) => setPrecio(e.target.value)} required placeholder="45000" />
            </Campo>
            <Campo label="Ancho (cm)">
              <input className={`${inputClass} mt-1.5`} inputMode="decimal" value={ancho} onChange={(e) => setAncho(e.target.value)} placeholder="30" />
            </Campo>
            <Campo label="Alto (cm)">
              <input className={`${inputClass} mt-1.5`} inputMode="decimal" value={alto} onChange={(e) => setAlto(e.target.value)} placeholder="40" />
            </Campo>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-tinta/10 bg-white/60 p-4">
          <div>
            <h3 className="font-semibold text-tinta">Paquete para envío (opcional)</h3>
            <p className="text-xs text-tinta/55">Medidas del cuadro ya embalado. Servirán para cotizar el envío con Starken más adelante.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Campo label="Peso (kg)"><input className={`${inputClass} mt-1.5`} inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} /></Campo>
            <Campo label="Largo (cm)"><input className={`${inputClass} mt-1.5`} inputMode="decimal" value={embLargo} onChange={(e) => setEmbLargo(e.target.value)} /></Campo>
            <Campo label="Ancho (cm)"><input className={`${inputClass} mt-1.5`} inputMode="decimal" value={embAncho} onChange={(e) => setEmbAncho(e.target.value)} /></Campo>
            <Campo label="Alto (cm)"><input className={`${inputClass} mt-1.5`} inputMode="decimal" value={embAlto} onChange={(e) => setEmbAlto(e.target.value)} /></Campo>
          </div>
        </section>

        {!editando && (
          <label className="flex min-h-11 items-center gap-3 text-sm text-tinta">
            <input type="checkbox" className="size-5" checked={publicar} onChange={(e) => setPublicar(e.target.checked)} />
            Publicar en la tienda al guardar (si no, queda como borrador)
          </label>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className={btn.secondary} onClick={onClose} disabled={guardando}>Cancelar</button>
          <button type="submit" className={btn.primary} disabled={guardando || procesando}>
            {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Guardar cuadro"}
          </button>
        </div>
      </form>
    </div>
  );
}
