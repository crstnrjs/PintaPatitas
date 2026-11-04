import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProductModal from "./ProductModal";
import { colorDe } from "./techniqueColors";

const clp = (n) => new Intl.NumberFormat("es-CL").format(n);
const mascotas = (n) => `${n} ${n === 1 ? "mascota" : "mascotas"}`;
const redondear = (n) => Math.round(n / 1000) * 1000;
const imagenUrl = (path) =>
  path ? supabase.storage.from("catalog").getPublicUrl(path).data.publicUrl : null;

function hace(fecha) {
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
  if (dias <= 0) return "hoy";
  return dias === 1 ? "hace 1 día" : `hace ${dias} días`;
}

const BTN =
  "rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50";

export default function AdminCatalog() {
  const [items, setItems] = useState([]);
  const [tecnicas, setTecnicas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos"); // "todos" o id de técnica
  const [menu, setMenu] = useState(null);        // id del producto con el menú abierto
  const [modal, setModal] = useState(null);      // { producto } — producto null = nuevo
  const [dup, setDup] = useState(null);          // producto que se está duplicando
  const [destino, setDestino] = useState("");
  const [pct, setPct] = useState(0);
  const [seleccion, setSeleccion] = useState(() => new Set());

  function avisar(tipo, texto) {
    setMensaje({ tipo, texto });
    if (tipo === "ok") setTimeout(() => setMensaje(null), 3000);
  }

  async function cargar() {
    const [prods, tecs] = await Promise.all([
      supabase
        .from("admin_catalog_items")
        .select("*")
        .order("sort_order")
        .order("pet_count")
        .order("price"),
      supabase.from("techniques").select("id, name, slug, has_size, is_active").order("sort_order"),
    ]);
    if (prods.error) avisar("error", prods.error.message);
    else {
      setItems(prods.data);
      const ids = new Set(prods.data.map((p) => p.id));
      setSeleccion((prev) => new Set([...prev].filter((id) => ids.has(id))));
    }
    if (tecs.data) setTecnicas(tecs.data);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return items.filter((p) => {
      if (filtro !== "todos" && p.technique_id !== filtro) return false;
      if (!q) return true;
      return `${p.technique_name} ${mascotas(p.pet_count)} ${p.size_label ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [items, busqueda, filtro]);

  const seleccionados = items.filter((p) => seleccion.has(p.id));
  const todosMarcados = visibles.length > 0 && visibles.every((p) => seleccion.has(p.id));

  function alternarSeleccion(id) {
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  function marcarTodos() {
    setSeleccion(todosMarcados ? new Set() : new Set(visibles.map((p) => p.id)));
  }

  async function alternar(p) {
    setMenu(null);
    const { error } = await supabase
      .from("price_list")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    if (error) avisar("error", error.message);
    cargar();
  }

  // Elimina uno o varios productos y sus fotos propias
  async function borrar(lista) {
    setMenu(null);
    if (lista.length === 0) return;
    const texto =
      lista.length === 1
        ? `¿Eliminar "${lista[0].technique_name} · ${mascotas(lista[0].pet_count)}${
            lista[0].size_label ? " · " + lista[0].size_label : ""
          }"?`
        : `¿Eliminar ${lista.length} productos?`;
    if (!confirm(`${texto}\nEsta acción no se puede deshacer.`)) return;

    const { error } = await supabase
      .from("price_list")
      .delete()
      .in("id", lista.map((p) => p.id));
    if (error) return avisar("error", error.message);

    const fotos = lista.map((p) => p.own_image_path).filter(Boolean);
    if (fotos.length > 0) await supabase.storage.from("catalog").remove(fotos);

    setSeleccion(new Set());
    avisar("ok", lista.length === 1 ? "Producto eliminado" : `${lista.length} productos eliminados`);
    cargar();
  }

  function abrirDuplicar(p) {
    setMenu(null);
    setDup(p);
    setDestino("");
    setPct(0);
  }

  // Duplicar no copia la foto: el nuevo producto parte con la predeterminada
  async function duplicar(e) {
    e.preventDefault();
    if (!destino) return avisar("error", "Elige la técnica de destino");
    const { error } = await supabase.from("price_list").insert({
      technique_id: destino,
      pet_count: dup.pet_count,
      width_cm: dup.width_cm,
      height_cm: dup.height_cm,
      price: redondear(dup.price * (1 + (Number(pct) || 0) / 100)),
      is_active: dup.is_active,
    });
    if (error) {
      return avisar(
        "error",
        error.message.includes("price_list_unico")
          ? "Esa técnica ya tiene este producto"
          : error.message
      );
    }
    avisar("ok", "Producto duplicado");
    setDup(null);
    cargar();
  }

  if (cargando) return <p className="p-4">Cargando catálogo...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-slate-500">Gestiona productos, precios y disponibilidad.</p>
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Buscar..."
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setSeleccion(new Set());
            }}
          />
          <button
            className="rounded-full bg-[#2d6583] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
            onClick={() => setModal({ producto: null })}
          >
            + Nuevo producto
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setFiltro("todos");
            setSeleccion(new Set());
          }}
          className={`rounded-full border px-4 py-1.5 text-sm ${
            filtro === "todos"
              ? "border-slate-800 bg-slate-800 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Todos
        </button>
        {tecnicas.map((t) => {
          const c = colorDe(t.slug);
          const activo = filtro === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setFiltro(t.id);
                setSeleccion(new Set());
              }}
              className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm ${
                activo ? c.chipOn : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {!activo && <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />}
              {t.name}
            </button>
          );
        })}
        {visibles.length > 0 && (
          <button className="ml-auto text-sm text-slate-600 underline" onClick={marcarTodos}>
            {todosMarcados ? "Quitar selección" : `Seleccionar todos (${visibles.length})`}
          </button>
        )}
      </div>

      {seleccionados.length > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-800 px-4 py-3 text-sm text-white shadow-lg">
          <span>
            {seleccionados.length} {seleccionados.length === 1 ? "seleccionado" : "seleccionados"}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-lg px-3 py-1 hover:bg-white/10"
              onClick={() => setSeleccion(new Set())}
            >
              Quitar selección
            </button>
            <button
              className="rounded-lg bg-red-500 px-3 py-1 font-semibold hover:bg-red-600"
              onClick={() => borrar(seleccionados)}
            >
              Eliminar
            </button>
          </div>
        </div>
      )}

      {mensaje && (
        <p
          className={`rounded-lg p-3 text-sm ${
            mensaje.tipo === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-lg text-slate-700">Aún no hay productos en el catálogo.</p>
          <p className="mt-1 text-sm text-slate-500">
            Pulsa "+ Nuevo producto" para crear el primero.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibles.map((p) => {
            const foto = imagenUrl(p.image_path);
            const c = colorDe(p.technique_slug);
            const marcado = seleccion.has(p.id);
            return (
              <article
                key={p.id}
                className={`flex gap-4 rounded-3xl border bg-white p-3 ${
                  marcado ? "border-[#2d6583] ring-2 ring-[#2d6583]" : "border-slate-200"
                }`}
              >
                <div className="relative shrink-0">
                  {foto ? (
                    <img
                      src={foto}
                      alt={`${p.technique_name}, ${mascotas(p.pet_count)}`}
                      className="h-40 w-32 rounded-2xl object-cover sm:h-[213px] sm:w-[170px]"
                    />
                  ) : (
                    <div className="flex h-40 w-32 items-center justify-center rounded-2xl bg-slate-100 text-xs text-slate-400 sm:h-[213px] sm:w-[170px]">
                      Sin foto
                    </div>
                  )}
                  <label className="absolute left-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-white/90 shadow">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={marcado}
                      onChange={() => alternarSeleccion(p.id)}
                      aria-label="Seleccionar producto"
                    />
                  </label>
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-wider ${
                        p.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.is_active ? "ACTIVO" : "BORRADOR"}
                    </span>
                    <span
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${c.pill}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                      {p.technique_name}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg text-slate-800">Retrato de {mascotas(p.pet_count)}</h3>
                  <p className="text-xs text-slate-500">{p.size_label ?? "Sin medidas"}</p>
                  <strong className="mt-3 text-lg text-slate-900">${clp(p.price)}</strong>
                  <small className="text-sm text-slate-500">Actualizado {hace(p.updated_at)}</small>

                  <div className="relative mt-auto flex gap-2 pt-3">
                    <button className={BTN} onClick={() => setModal({ producto: p })}>
                      Editar
                    </button>
                    <button className={BTN} onClick={() => abrirDuplicar(p)}>
                      Duplicar
                    </button>
                    <button className={BTN} onClick={() => setMenu(menu === p.id ? null : p.id)}>
                      •••
                    </button>

                    {menu === p.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} />
                        <div className="absolute bottom-full left-0 z-20 mb-1 w-44 rounded-lg border bg-white py-1 text-sm shadow-lg">
                          <button
                            className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                            onClick={() => alternar(p)}
                          >
                            {p.is_active ? "Ocultar (borrador)" : "Mostrar en el sitio"}
                          </button>
                          <button
                            className="block w-full px-3 py-2 text-left text-red-600 hover:bg-slate-50"
                            onClick={() => borrar([p])}
                          >
                            Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          {visibles.length === 0 && (
            <p className="text-slate-500">Ningún producto coincide con el filtro o la búsqueda.</p>
          )}
        </div>
      )}

      {modal && (
        <ProductModal
          tecnicas={tecnicas}
          producto={modal.producto}
          onClose={() => setModal(null)}
          onSaved={(msg) => {
            setModal(null);
            avisar("ok", msg);
            cargar();
          }}
        />
      )}

      {dup && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={duplicar} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6">
            <h2 className="text-lg font-semibold">
              Duplicar {dup.technique_name} · {mascotas(dup.pet_count)}
              {dup.size_label ? ` · ${dup.size_label}` : ""}
            </h2>
            <label className="block text-sm">
              Copiar a la técnica
              <select
                className="mt-1 block w-full rounded border p-2"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
              >
                <option value="">Elige una...</option>
                {tecnicas
                  .filter((t) => t.id !== dup.technique_id && t.has_size === dup.has_size)
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
              </select>
              <span className="text-xs text-slate-500">
                Solo aparecen técnicas del mismo tipo (con o sin medidas).
              </span>
            </label>
            <label className="block text-sm">
              Ajuste de precio (%)
              <input
                type="number"
                className="mt-1 block w-full rounded border p-2"
                value={pct}
                onChange={(e) => setPct(e.target.value)}
              />
              <span className="text-xs text-slate-500">
                0 copia el mismo precio. Se redondea a miles.
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className={BTN} onClick={() => setDup(null)}>
                Cancelar
              </button>
              <button type="submit" className="rounded-lg bg-[#2d6583] px-4 py-2 text-sm text-white">
                Duplicar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}