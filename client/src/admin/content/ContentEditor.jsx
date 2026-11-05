import { useEffect, useState } from "react";
import { Eye, EyeOff, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Aviso, EmptyState, PageHeader, Panel, Skeleton, Toast, btn, inputClass } from "@/admin/shared/ui";

const BUCKET = "landing";
const TABS = [
  ["gallery_items", "Galería"],
  ["before_after_items", "Foto → obra"],
  ["testimonials", "Testimonios"],
];
const mediaUrl = (path) => path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : "";

async function procesarImagen(file) {
  if (!file?.type.startsWith("image/")) throw new Error("Selecciona un archivo de imagen");
  if (file.size > 20 * 1024 * 1024) throw new Error("La imagen debe pesar menos de 20 MB");
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error("No se pudo procesar la imagen")), "image/webp", 0.82));
  return { blob, width: canvas.width, height: canvas.height };
}

export default function ContentEditor() {
  const [tab, setTab] = useState(TABS[0][0]);
  const [items, setItems] = useState([]);
  const [techniques, setTechniques] = useState([]);
  const [settings, setSettings] = useState({ instagram_url: "", trust_phrase: "" });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [rows, techs, config] = await Promise.all([
      tab === "ajustes"
        ? Promise.resolve({ data: [], error: null })
        : supabase.from(tab).select("*").order("sort_order").order("created_at"),
      tab === "ajustes" ? Promise.resolve({ data: [], error: null }) : supabase.from("techniques").select("id,name,is_active").order("sort_order"),
      tab === "ajustes" ? supabase.from("site_settings").select("key,value").in("key", ["instagram_url", "trust_phrase"]) : Promise.resolve({ data: [], error: null }),
    ]);
    if (rows.error) setError(`No se pudo cargar el contenido. ${rows.error.message}`);
    else { setItems(rows.data ?? []); setError(""); }
    if (techs.data) setTechniques(techs.data);
    if (config.data) setSettings((prev) => ({ ...prev, ...Object.fromEntries(config.data.map(({ key, value }) => [key, value ?? ""])) }));
    if (config.error && config.error.code !== "42P01" && config.error.code !== "PGRST205") {
      setError(`No se pudieron cargar los ajustes. ${config.error.message}`);
    }
    if (config.error && ["42P01", "PGRST205"].includes(config.error.code)) {
      setError(`Falta aplicar la migración de contenido en Supabase para crear site_settings. ${config.error.message}`);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggle(item) {
    const { error: err } = await supabase.from(tab).update({ is_visible: !item.is_visible }).eq("id", item.id);
    if (err) setError(`No se pudo cambiar la visibilidad: ${err.message}`);
    else { setToast(item.is_visible ? "Contenido ocultado" : "Contenido publicado"); load(); }
  }
  async function remove(item) {
    if (!confirm("¿Eliminar este contenido? Esta acción no se puede deshacer.")) return;
    const { error: err } = await supabase.from(tab).delete().eq("id", item.id);
    if (err) return setError(`No se pudo eliminar: ${err.message}`);
    const paths = [item.image_path, item.photo_path, item.artwork_path].filter(Boolean);
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    setToast("Contenido eliminado"); load();
  }
  async function saveSettings(e) {
    e.preventDefault(); setError("");
    if (settings.instagram_url && !/^https:\/\//i.test(settings.instagram_url.trim())) return setError("El enlace de Instagram debe comenzar con https://");
    setSaving(true);
    const results = await Promise.all(Object.entries(settings).map(([key, value]) => supabase.from("site_settings").upsert({ key, value: value.trim() }, { onConflict: "key" })));
    setSaving(false);
    const failed = results.find((r) => r.error);
    if (failed) setError(`No se pudieron guardar los ajustes: ${failed.error.message}`);
    else setToast("Ajustes guardados");
  }

  return <div className="space-y-6">
    <PageHeader title="Contenido" description="Administra las obras, historias y enlaces que aparecen en la página de inicio.">
      {tab !== "ajustes" && <button className={btn.primary} onClick={() => { setError(""); setModal(true); }}><Plus size={17} /> Agregar contenido</button>}
    </PageHeader>
    <div role="tablist" aria-label="Secciones de contenido" className="flex flex-wrap gap-2">
      {[...TABS, ["ajustes", "Ajustes"]].map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setError(""); }} className={`${btn.secondary} ${tab === id ? "!border-acento !bg-acento/10" : ""}`}>{label}</button>)}
    </div>
    {error && <Aviso onClose={() => setError("")}>{error}</Aviso>}
    {tab === "ajustes" ? <Panel title="Presencia de marca" description="Los campos vacíos no se mostrarán en la landing."><form className="max-w-xl space-y-5" onSubmit={saveSettings}>
      <label className="block text-sm font-medium">Enlace de Instagram<input className={`${inputClass} mt-1.5`} type="url" placeholder="https://instagram.com/…" value={settings.instagram_url ?? ""} onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })} /></label>
      <label className="block text-sm font-medium">Frase de confianza<input className={`${inputClass} mt-1.5`} maxLength={160} value={settings.trust_phrase ?? ""} onChange={(e) => setSettings({ ...settings, trust_phrase: e.target.value })} /><span className="mt-1 block text-xs text-tinta/55">Solo publica cifras verificables.</span></label>
      <button className={btn.primary} disabled={saving}>{saving ? "Guardando…" : "Guardar ajustes"}</button>
    </form></Panel> : loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Cargando contenido">{[0,1,2].map((n) => <Skeleton key={n} className="h-72 rounded-[26px]" />)}</div> : items.length === 0 ? <Panel><EmptyState title="Todavía no hay contenido" text="Agrega material real y autorizado para que aparezca en la landing."><button className={btn.primary} onClick={() => setModal(true)}><Plus size={17} /> Agregar contenido</button></EmptyState></Panel> : <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => {
      const paths = [item.image_path, item.photo_path, item.artwork_path].filter(Boolean);
      const text = item.quote ?? item.alt ?? "";
      return <li key={item.id} className="overflow-hidden rounded-[26px] border border-white/80 bg-white/85 p-3 shadow-[0_18px_40px_-30px_rgb(19_48_61/0.55)]">
        {paths.length > 1 ? <div className="grid grid-cols-2 gap-1">{paths.map((p) => <img key={p} src={mediaUrl(p)} alt="" className="aspect-square w-full rounded-xl object-cover" />)}</div> : paths.length ? <img src={mediaUrl(paths[0])} alt={item.alt ?? ""} className="aspect-[4/3] w-full rounded-xl object-cover" /> : null}
        <p className="mt-3 line-clamp-3 text-sm text-tinta/75">{text}</p>
        {item.author_name && <p className="mt-1 text-xs text-tinta/55">{item.author_name}{item.pet_name ? ` · ${item.pet_name}` : ""}</p>}
        <div className="mt-3 flex items-center justify-between gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_visible ? "bg-[#e1f0e6] text-[#2d6844]" : "bg-bruma text-tinta/60"}`}>{item.is_visible ? "Visible" : "Oculto"}</span><div className="flex gap-1"><button className={btn.secondary} aria-label={item.is_visible ? "Ocultar" : "Mostrar"} onClick={() => toggle(item)}>{item.is_visible ? <EyeOff size={16}/> : <Eye size={16}/>}</button><button className={btn.danger} aria-label="Eliminar" onClick={() => remove(item)}><Trash2 size={16}/></button></div></div>
      </li>;
    })}</ul>}
    {toast && <Toast onClose={() => setToast("")}>{toast}</Toast>}
    {modal && <Formulario tipo={tab} techniques={techniques} onClose={() => setModal(false)} onSaved={() => { setModal(false); setToast("Contenido agregado"); load(); }} onError={setError} />}
  </div>;
}

function Formulario({ tipo, techniques, onClose, onSaved, onError }) {
  const [alt, setAlt] = useState(""); const [technique, setTechnique] = useState("");
  const [quote, setQuote] = useState(""); const [author, setAuthor] = useState(""); const [pet, setPet] = useState("");
  const [consent, setConsent] = useState(false); const [visible, setVisible] = useState(false);
  const [files, setFiles] = useState([]); const [previews, setPreviews] = useState([]); const [busy, setBusy] = useState(false);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);
  async function choose(e, indice = null) {
    try {
      const chosen = [...e.target.files]; e.target.value = "";
      if (tipo === "before_after_items") {
        if (chosen.length !== 1) throw new Error("Selecciona una imagen para este campo");
        const procesada = await procesarImagen(chosen[0]);
        setFiles((actuales) => {
          const siguientes = [...actuales];
          siguientes[indice] = procesada;
          setPreviews((anteriores) => {
            const actualizadas = [...anteriores];
            if (actualizadas[indice]) URL.revokeObjectURL(actualizadas[indice]);
            actualizadas[indice] = URL.createObjectURL(procesada.blob);
            return actualizadas;
          });
          return siguientes;
        });
        return;
      }
      const required = tipo === "testimonials" ? 0 : 1;
      if (chosen.length !== required && (required === 1 && chosen.length !== 1)) throw new Error("Selecciona la imagen de la obra");
      const processed = await Promise.all(chosen.map(procesarImagen));
      setFiles(processed); setPreviews(processed.map((x) => URL.createObjectURL(x.blob)));
    } catch (err) { onError(err.message); }
  }
  async function submit(e) {
    e.preventDefault(); onError("");
    if (tipo !== "testimonials" && !alt.trim()) return onError("Escribe una descripción accesible para las imágenes");
    if (tipo === "testimonials" && !quote.trim()) return onError("Escribe el testimonio real autorizado");
    if (tipo === "testimonials" && visible && !consent) return onError("Confirma la autorización antes de publicar");
    if (tipo !== "testimonials" && files.length !== (tipo === "before_after_items" ? 2 : 1)) return onError("Selecciona las imágenes requeridas");
    setBusy(true); const uploaded = [];
    try {
      for (const file of files) {
        const path = `${tipo}/${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file.blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (error) throw error; uploaded.push(path);
      }
      const base = { sort_order: 0, is_visible: visible };
      let row;
      if (tipo === "gallery_items") row = { ...base, image_path: uploaded[0], width: files[0].width, height: files[0].height, alt: alt.trim(), technique_id: technique || null };
      if (tipo === "before_after_items") row = { ...base, photo_path: uploaded[0], artwork_path: uploaded[1], width: files[1].width, height: files[1].height, alt: alt.trim(), technique_id: technique || null };
      if (tipo === "testimonials") row = { ...base, quote: quote.trim(), author_name: author.trim() || null, pet_name: pet.trim() || null, image_path: uploaded[0] ?? null, consent_confirmed: consent };
      const { error } = await supabase.from(tipo).insert(row);
      if (error) throw error;
      onSaved();
    } catch (err) {
      if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded);
      onError(`No se pudo guardar el contenido: ${err.message}`); setBusy(false);
    }
  }
  return <div className="fixed inset-0 z-40 flex items-end justify-center bg-tinta/35 p-0 backdrop-blur-sm sm:items-center sm:p-4"><form onSubmit={submit} className="max-h-[94vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-t-[28px] bg-papel p-5 shadow-2xl sm:rounded-[28px] sm:p-6">
    <div className="flex items-center justify-between"><h2 className="font-display text-2xl">{tipo === "gallery_items" ? "Nueva obra" : tipo === "before_after_items" ? "Nuevo par foto → obra" : "Nuevo testimonio"}</h2><button type="button" className={btn.secondary} onClick={onClose}>Cerrar</button></div>
    {tipo === "testimonials" ? <><label className="block text-sm font-medium">Testimonio real<textarea className={`${inputClass} mt-1.5 h-28 py-3`} value={quote} onChange={(e) => setQuote(e.target.value)} required maxLength={1000}/></label><label className="block text-sm font-medium">Nombre del cliente (opcional)<input className={`${inputClass} mt-1.5`} value={author} onChange={(e) => setAuthor(e.target.value)}/></label><label className="block text-sm font-medium">Nombre de la mascota (opcional)<input className={`${inputClass} mt-1.5`} value={pet} onChange={(e) => setPet(e.target.value)}/></label><label className="block text-sm font-medium">Foto asociada (opcional)<input className={`${inputClass} mt-1.5 py-2`} type="file" accept="image/jpeg,image/png,image/webp" onChange={choose}/></label>{previews.length > 0 && <img src={previews[0]} alt="Vista previa" className="aspect-square w-32 rounded-xl object-cover"/>}<label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="size-5" checked={consent} onChange={(e) => setConsent(e.target.checked)}/>El cliente autorizó publicar este testimonio y los datos asociados.</label></> : <>{tipo === "before_after_items" ? <div className="grid gap-4 sm:grid-cols-2">{["Foto de la mascota", "Foto del cuadro terminado"].map((label, indice) => <label key={label} className="block text-sm font-medium">{label}<input className={`${inputClass} mt-1.5 py-2`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => choose(e, indice)}/>{previews[indice] ? <img src={previews[indice]} alt={`Vista previa: ${label.toLowerCase()}`} className="mt-2 aspect-square w-full rounded-xl object-cover"/> : <span className="mt-2 flex aspect-square items-center justify-center rounded-xl border border-dashed border-tinta/20 text-sm text-tinta/50">Selecciona una imagen</span>}</label>)}</div> : <><label className="block text-sm font-medium">Imagen de la obra<input className={`${inputClass} mt-1.5 py-2`} type="file" accept="image/jpeg,image/png,image/webp" onChange={choose}/></label>{previews.length > 0 && <img src={previews[0]} alt="Vista previa" className="aspect-square w-32 rounded-xl object-cover"/>}</>}<label className="block text-sm font-medium">Descripción accesible<textarea className={`${inputClass} mt-1.5 h-20 py-3`} value={alt} onChange={(e) => setAlt(e.target.value)} required maxLength={240}/></label><label className="block text-sm font-medium">Técnica (opcional)<select className={`${inputClass} mt-1.5`} value={technique} onChange={(e) => setTechnique(e.target.value)}><option value="">Sin técnica</option>{techniques.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label></>}
    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="size-5" checked={visible} onChange={(e) => setVisible(e.target.checked)}/>Mostrar en la landing</label>
    <div className="flex justify-end gap-2"><button type="button" className={btn.secondary} onClick={onClose} disabled={busy}>Cancelar</button><button className={btn.primary} disabled={busy}><Upload size={16}/>{busy ? "Guardando…" : "Guardar"}</button></div>
  </form></div>;
}
