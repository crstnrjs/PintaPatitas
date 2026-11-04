import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { colorDe } from "./techniqueColors";

const BUCKET = "catalog";
const CANTIDADES = [1, 2, 3, 4];
const TAMANOS_COMUNES = [
  [15, 15], [15, 20], [20, 20], [20, 30], [30, 30], [30, 60],
  [40, 40], [50, 50], [50, 60], [60, 90], [100, 70], [100, 120],
];

const clp = (n) => new Intl.NumberFormat("es-CL").format(n);
const mascotas = (n) => `${n} ${n === 1 ? "mascota" : "mascotas"}`;
const urlPublica = (path) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

// Reduce y convierte a webp para que la página cargue rápido
async function aWebp(file, maxLado = 1600, calidad = 0.82) {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen"))),
      "image/webp",
      calidad
    )
  );
}

function Paso({ n, titulo, ayuda, children }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
          {n}
        </span>
        <h3 className="font-semibold text-slate-800">{titulo}</h3>
      </div>
      {ayuda && <p className="text-xs text-slate-500">{ayuda}</p>}
      {children}
    </section>
  );
}

// producto = null → crear; producto = fila de admin_catalog_items → editar
export default function ProductModal({ tecnicas, producto, onClose, onSaved }) {
  const editando = Boolean(producto);

  const [tecnicaId, setTecnicaId] = useState(producto?.technique_id ?? "");
  const [cantidad, setCantidad] = useState(producto?.pet_count ?? 1);
  const [ancho, setAncho] = useState(producto?.width_cm ?? "");
  const [alto, setAlto] = useState(producto?.height_cm ?? "");
  const [precio, setPrecio] = useState(producto?.price ?? "");
  const [activo, setActivo] = useState(producto?.is_active ?? true);
  const [fotoActual] = useState(producto?.own_image_path ?? null); // ruta en Storage
  const [fotoNueva, setFotoNueva] = useState(null); // { blob, preview }
  const [quitarFoto, setQuitarFoto] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const inputFile = useRef(null);

  const opciones = tecnicas.filter((t) => t.is_active || t.id === producto?.technique_id);
  const tecnica = tecnicas.find((t) => t.id === tecnicaId);
  const sinTamano = tecnica ? !tecnica.has_size : false;

  // Libera la vista previa anterior cuando cambia o al cerrar
  useEffect(() => {
    return () => {
      if (fotoNueva) URL.revokeObjectURL(fotoNueva.preview);
    };
  }, [fotoNueva]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !guardando) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guardando, onClose]);

  const vistaFoto = fotoNueva
    ? fotoNueva.preview
    : !quitarFoto && fotoActual
    ? urlPublica(fotoActual)
    : null;

  function elegirTecnica(t) {
    setTecnicaId(t.id);
    if (!t.has_size) {
      setAncho("");
      setAlto("");
    }
  }

  async function elegirFoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return setError("El archivo debe ser una imagen (JPG, PNG o WebP)");
    }
    if (file.size > 20 * 1024 * 1024) {
      return setError("La imagen pesa demasiado (máximo 20 MB)");
    }
    try {
      const blob = await aWebp(file);
      setFotoNueva({ blob, preview: URL.createObjectURL(blob) });
      setQuitarFoto(false);
      setError("");
    } catch {
      setError("No se pudo leer esa imagen. Prueba con otra (JPG o PNG).");
    }
  }

  function quitar() {
    setFotoNueva(null);
    setQuitarFoto(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setError("");

    if (!tecnicaId) return setError("Elige el tipo de pintura");
    const price = parseInt(precio, 10);
    if (!(price > 0)) return setError("Ingresa un precio mayor a 0");

    let width_cm = null;
    let height_cm = null;
    if (!sinTamano) {
      width_cm = parseInt(ancho, 10);
      height_cm = parseInt(alto, 10);
      if (!(width_cm > 0) || !(height_cm > 0)) {
        return setError("Ingresa el ancho y el alto, o elige un tamaño de la lista");
      }
    }

    setGuardando(true);
    let subida = null;
    try {
      if (fotoNueva) {
        subida = `products/${crypto.randomUUID()}.webp`;
        const { error: errSubida } = await supabase.storage
          .from(BUCKET)
          .upload(subida, fotoNueva.blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (errSubida) throw new Error(`No se pudo subir la foto: ${errSubida.message}`);
      }

      const image_path = fotoNueva ? subida : quitarFoto ? null : fotoActual;
      const datos = {
        technique_id: tecnicaId,
        pet_count: cantidad,
        width_cm,
        height_cm,
        price,
        is_active: activo,
        image_path,
      };

      const { error: errBD } = editando
        ? await supabase.from("price_list").update(datos).eq("id", producto.id)
        : await supabase.from("price_list").insert(datos);

      if (errBD) {
        if (subida) await supabase.storage.from(BUCKET).remove([subida]); // no dejar la foto huérfana
        throw new Error(
          errBD.message.includes("price_list_unico")
            ? "Ya existe un producto con esa técnica, cantidad de mascotas y tamaño. Búscalo en el catálogo para editarlo."
            : errBD.message
        );
      }

      // Si se reemplazó o quitó la foto anterior, se borra el archivo viejo
      if (editando && fotoActual && (fotoNueva || quitarFoto)) {
        await supabase.storage.from(BUCKET).remove([fotoActual]);
      }

      onSaved(editando ? "Producto actualizado" : "Producto creado");
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  const price = parseInt(precio, 10);
  const resumen = [
    tecnica?.name,
    mascotas(cantidad),
    !sinTamano && ancho && alto ? `${ancho} × ${alto} cm` : null,
    price > 0 ? `$${clp(price)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && !guardando && onClose()}
    >
      <form
        onSubmit={guardar}
        className="flex max-h-[94vh] w-full max-w-xl flex-col rounded-t-3xl bg-white sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-800">
            {editando ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="rounded-full px-2 text-2xl leading-none text-slate-400 hover:text-slate-700"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto px-6 py-5">
          <Paso n={1} titulo="Tipo de pintura">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {opciones.map((t) => {
                const c = colorDe(t.slug);
                const elegido = t.id === tecnicaId;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => elegirTecnica(t)}
                    className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 text-sm font-medium transition ${
                      elegido
                        ? c.sel
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full ${c.dot}`} />
                    {t.name}
                  </button>
                );
              })}
            </div>
          </Paso>

          <Paso n={2} titulo="Cantidad de mascotas">
            <div className="grid grid-cols-4 gap-2">
              {CANTIDADES.map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setCantidad(n)}
                  className={`rounded-2xl border-2 py-2 text-center transition ${
                    cantidad === n
                      ? "border-[#2d6583] bg-[#2d6583]/10 text-[#2d6583]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="block text-lg font-semibold">{n}</span>
                  <span className="block text-[11px]">{n === 1 ? "mascota" : "mascotas"}</span>
                </button>
              ))}
            </div>
          </Paso>

          <Paso
            n={3}
            titulo="Tamaño del cuadro"
            ayuda={sinTamano ? null : "Elige un tamaño habitual o escribe las medidas en cm."}
          >
            {sinTamano ? (
              <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                La pintura digital no lleva medidas, así que no hay nada que elegir aquí.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {TAMANOS_COMUNES.map(([w, h]) => {
                    const elegido = Number(ancho) === w && Number(alto) === h;
                    return (
                      <button
                        type="button"
                        key={`${w}x${h}`}
                        onClick={() => {
                          setAncho(w);
                          setAlto(h);
                        }}
                        className={`rounded-full border px-3 py-1 text-sm transition ${
                          elegido
                            ? "border-[#2d6583] bg-[#2d6583] text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {w} × {h}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-end gap-3">
                  <label className="text-sm text-slate-600">
                    Ancho (cm)
                    <input
                      type="number"
                      min="1"
                      className="mt-1 block w-28 rounded-xl border border-slate-300 p-2"
                      value={ancho}
                      onChange={(e) => setAncho(e.target.value)}
                    />
                  </label>
                  <span className="pb-2 text-slate-400">×</span>
                  <label className="text-sm text-slate-600">
                    Alto (cm)
                    <input
                      type="number"
                      min="1"
                      className="mt-1 block w-28 rounded-xl border border-slate-300 p-2"
                      value={alto}
                      onChange={(e) => setAlto(e.target.value)}
                    />
                  </label>
                </div>
              </>
            )}
          </Paso>

          <Paso n={4} titulo="Precio">
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-slate-300 px-3">
                <span className="text-slate-400">$</span>
                <input
                  type="number"
                  min="1"
                  className="w-36 p-2 outline-none"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />
              </div>
              {price > 0 && <span className="text-sm text-slate-500">${clp(price)} CLP</span>}
            </div>
          </Paso>

          <Paso
            n={5}
            titulo="Foto del producto"
            ayuda={`Opcional. Si no subes una foto, el sitio usará la foto predeterminada para ${mascotas(cantidad)}.`}
          >
            <div className="flex items-center gap-4">
              <div className="h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                {vistaFoto ? (
                  <img src={vistaFoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center px-2 text-center text-xs text-slate-400">
                    Sin foto
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => inputFile.current?.click()}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  {vistaFoto ? "Cambiar foto" : "Subir foto"}
                </button>
                {vistaFoto && (
                  <button
                    type="button"
                    onClick={quitar}
                    className="rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Quitar
                  </button>
                )}
              </div>
              <input
                ref={inputFile}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={elegirFoto}
              />
            </div>
          </Paso>

          <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
            />
            <span>
              <strong className="text-slate-800">Mostrar en el sitio</strong>
              <span className="block text-xs text-slate-500">
                Si lo desactivas, queda como borrador y los clientes no lo ven.
              </span>
            </span>
          </label>
        </div>

        <div className="space-y-3 border-t px-6 py-4">
          {error && <p className="rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm text-slate-500">{resumen}</p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={guardando}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="rounded-xl bg-[#2d6583] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear producto"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}