import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Copy, Ellipsis, Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import ProductModal from "./ProductModal";
import { EmptyState, PageHeader, Panel, Skeleton, Toast, btn, inputClass, modalOverlay, modalPanel } from "@/admin/shared/ui";
import { colorDe } from "./techniqueColors";
// "porcentaje" porque este componente ya tiene un estado llamado pct (ajuste masivo de precios).
import { MP_PORCENTAJE, pct as porcentaje, useCobros } from "@/admin/shared/useCobros";

const clp = (n) => new Intl.NumberFormat("es-CL").format(n);
const mascotas = (n) => `${n} ${n === 1 ? "mascota" : "mascotas"}`;
const redondear = (n) => Math.round(n / 1000) * 1000;
// Nombre puesto por la artista; si no hay, el título de siempre.
// El estilo Meme es un cuadro sin cantidad de mascotas: no se muestra "1 mascota".
const esMemeP = (p) => p.technique_slug === "meme";
const cantidadTxt = (p, sep) => (esMemeP(p) ? "" : `${sep}${mascotas(p.pet_count)}`);
const tituloDe = (p) =>
  p.name || (esMemeP(p) ? "Cuadro de meme" : `Retrato de ${mascotas(p.pet_count)}`);
const imagenUrl = (path) =>
  path ? supabase.storage.from("catalog").getPublicUrl(path).data.publicUrl : null;

function hace(fecha) {
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
  if (dias <= 0) return "hoy";
  return dias === 1 ? "hace 1 día" : `hace ${dias} días`;
}

const BTN =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-tinta/12 bg-white px-3.5 text-sm font-medium text-acento-oscuro transition hover:bg-bruma/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento";

// Tarjeta memoizada: abrir un modal o marcar otra tarjeta no la vuelve a renderizar.
const TarjetaProducto = memo(function TarjetaProducto({
  p, marcado, menuAbierto, comision, abono: abonoPct,
  onSeleccion, onEditar, onDuplicar, onMenu, onAlternar, onBorrar,
}) {
  const foto = imagenUrl(p.image_path);
  const c = colorDe(p.technique_slug);
  // Mismos porcentajes con que cobra el servidor; sin ellos no se muestra la proyección.
  const proyeccion = comision != null && abonoPct != null;
  const abono = Math.round(p.price * (abonoPct ?? 0) / 100);
  const saldo = p.price - abono;
  const mpTotal = Math.round(abono * MP_PORCENTAJE / 100) + Math.round(saldo * MP_PORCENTAJE / 100);
  const chris = Math.round(p.price * (comision ?? 0) / 100);
  const amiga = Math.max(p.price - mpTotal - chris, 0);
  return (
      <li
        className={`group flex flex-col rounded-[26px] bg-white/85 p-2.5 shadow-[0_18px_40px_-30px_rgb(19_48_61/0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-28px_rgb(19_48_61/0.6)] ${
          marcado ? "ring-2 ring-acento" : "ring-1 ring-white/80"
        } ${p.is_active ? "" : "opacity-85"}`}
      >
        <div className="relative overflow-hidden rounded-[20px] bg-bruma/60">
          {foto ? (
            <img
              src={foto}
              alt={`${p.name ? p.name + ", " : ""}${p.technique_name}${cantidadTxt(p, ", ")}`}
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-sm text-tinta/40">Sin foto</div>
          )}
          <label className="absolute top-2.5 left-2.5 grid size-9 cursor-pointer place-items-center rounded-xl bg-white/90 shadow-sm">
            <input
              type="checkbox"
              className="size-4 accent-acento"
              checked={marcado}
              onChange={() => onSeleccion(p.id)}
              aria-label={`Seleccionar ${p.name ? p.name + ", " : ""}${p.technique_name}${cantidadTxt(p, ", ")}`}
            />
          </label>
          <span
            className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wider ${
              p.is_active ? "bg-[#e1f0e6] text-[#2d6844]" : "bg-white/90 text-tinta/60"
            }`}
          >
            {p.is_active ? "ACTIVO" : "BORRADOR"}
          </span>
        </div>

        <div className="flex flex-1 flex-col px-3 pt-4 pb-2">
          <span className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${c.pill}`}>
            <span aria-hidden="true" className={`size-1.5 rounded-full ${c.dot}`} />
            {p.technique_name}
          </span>
          <h3 className="mt-2.5 text-lg font-semibold text-tinta">{tituloDe(p)}</h3>
          <p className="text-sm text-tinta/55">
            {p.name && !esMemeP(p) ? `${mascotas(p.pet_count)} · ` : ""}
            {p.size_label ?? "Sin medidas"}
          </p>

          <div className="mt-4 flex items-end justify-between gap-3">
            <strong className="font-display text-2xl text-tinta">${clp(p.price)}</strong>
            <small className="text-xs text-tinta/45">Actualizado {hace(p.updated_at)}</small>
          </div>
          {/* Proyección de lo que recibe la amiga */}
          {proyeccion && (
            <p className="mt-1 text-[11px] leading-tight text-tinta/45">
              Recibes <span className="font-semibold text-[#2d6844]">${clp(amiga)}</span>
              <span className="ml-1">(MP −${clp(mpTotal)} · Chris {porcentaje(comision)} −${clp(chris)})</span>
            </p>
          )}

          <div className="relative mt-auto flex gap-2 pt-4">
            <button className={`${BTN} flex-1`} onClick={() => onEditar(p)}>
              <Pencil size={14} aria-hidden="true" /> Editar
            </button>
            <button className={`${BTN} flex-1`} onClick={() => onDuplicar(p)}>
              <Copy size={14} aria-hidden="true" /> Duplicar
            </button>
            <button
              className={BTN}
              aria-label="Más acciones"
              aria-expanded={menuAbierto}
              onClick={() => onMenu(menuAbierto ? null : p.id)}
            >
              <Ellipsis size={16} aria-hidden="true" />
            </button>

            {menuAbierto && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => onMenu(null)} />
                <div className="absolute right-0 bottom-full z-20 mb-2 w-52 rounded-2xl border border-tinta/10 bg-papel p-1.5 text-sm shadow-[0_20px_40px_-20px_rgb(19_48_61/0.6)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
                  <button className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left hover:bg-bruma/50" onClick={() => onAlternar(p)}>
                    {p.is_active ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                    {p.is_active ? "Ocultar (borrador)" : "Mostrar en el sitio"}
                  </button>
                  <button className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-[#963a31] hover:bg-[#f7e3e1]" onClick={() => onBorrar([p])}>
                    <Trash2 size={15} aria-hidden="true" /> Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </li>
  );
});

export default function AdminCatalog() {
  const cobros = useCobros();
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
    const [prods, tecs, nombres] = await Promise.all([
      supabase
        .from("admin_catalog_items")
        .select("*")
        .order("sort_order")
        .order("pet_count")
        .order("price"),
      supabase.from("techniques").select("id, name, slug, has_size, is_active").order("sort_order"),
      // La vista admin_catalog_items no incluye la columna name: se lee directo de price_list.
      // Si la migración aún no está aplicada, falla y los productos se muestran sin nombre.
      supabase.from("price_list").select("id, name"),
    ]);
    if (prods.error) avisar("error", prods.error.message);
    else {
      const porId = new Map((nombres.data ?? []).map((n) => [n.id, n.name]));
      setItems(prods.data.map((p) => ({ ...p, name: porId.get(p.id) ?? p.name ?? null })));
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
      return `${p.name ?? ""} ${p.technique_name} ${esMemeP(p) ? "" : mascotas(p.pet_count)} ${p.size_label ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [items, busqueda, filtro]);

  const seleccionados = items.filter((p) => seleccion.has(p.id));
  const todosMarcados = visibles.length > 0 && visibles.every((p) => seleccion.has(p.id));

  const alternarSeleccion = useCallback((id) => {
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }, []);

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
        ? `¿Eliminar "${lista[0].name ? lista[0].name + " · " : ""}${lista[0].technique_name}${cantidadTxt(lista[0], " · ")}${
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

  // Callbacks estables para las tarjetas memoizadas: siempre llaman a la versión más reciente.
  const acciones = useRef({});
  useEffect(() => {
    acciones.current = { alternar, borrar, abrirDuplicar };
  });
  const abrirEditar = useCallback((p) => setModal({ producto: p }), []);
  const abrirDuplicarEst = useCallback((p) => acciones.current.abrirDuplicar(p), []);
  const alternarEst = useCallback((p) => acciones.current.alternar(p), []);
  const borrarEst = useCallback((lista) => acciones.current.borrar(lista), []);

  // Duplicar no copia la foto: el nuevo producto parte con la predeterminada
  async function duplicar(e) {
    e.preventDefault();
    if (!destino) return avisar("error", "Elige la técnica de destino");
    const { error } = await supabase.from("price_list").insert({
      name: dup.name ?? null,
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

  if (cargando)
    return (
      <div aria-label="Cargando catálogo">
        <Skeleton className="mb-8 h-12 w-56" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-96 rounded-[26px]" />
          ))}
        </div>
      </div>
    );

  const chip = (activo, extra = "") =>
    `flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento ${
      activo ? extra : "border-transparent text-tinta/65 hover:bg-white hover:text-tinta"
    }`;

  return (
    <div className="space-y-6">
      <PageHeader title="Catálogo" description="Gestiona productos, precios y disponibilidad. Lo que marques como activo es lo que ven los clientes.">
        <button className={btn.primary} onClick={() => setModal({ producto: null })}>
          <Plus size={17} aria-hidden="true" /> Nuevo producto
        </button>
      </PageHeader>

      <div className="vidrio flex flex-col gap-3 rounded-[24px] p-2.5 lg:flex-row lg:items-center">
        <label className="relative lg:w-72">
          <span className="sr-only">Buscar productos</span>
          <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-tinta/40" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar nombre, técnica, mascotas o medida"
            className={`${inputClass} pl-11`}
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setSeleccion(new Set());
            }}
          />
        </label>

        <div role="group" aria-label="Filtrar por técnica" className="-mx-1 flex flex-1 gap-1 overflow-x-auto px-1 pb-0.5">
          <button
            aria-pressed={filtro === "todos"}
            onClick={() => {
              setFiltro("todos");
              setSeleccion(new Set());
            }}
            className={chip(filtro === "todos", "border-acento-oscuro bg-acento-oscuro text-white")}
          >
            Todos
          </button>
          {tecnicas.map((t) => {
            const c = colorDe(t.slug);
            const activo = filtro === t.id;
            return (
              <button
                key={t.id}
                aria-pressed={activo}
                onClick={() => {
                  setFiltro(t.id);
                  setSeleccion(new Set());
                }}
                className={chip(activo, c.chipOn)}
              >
                {!activo && <span aria-hidden="true" className={`size-2.5 rounded-full ${c.dot}`} />}
                {t.name}
              </button>
            );
          })}
        </div>

        {visibles.length > 0 && (
          <button className={`${btn.ghost} shrink-0`} onClick={marcarTodos}>
            {todosMarcados ? "Quitar selección" : `Seleccionar todos (${visibles.length})`}
          </button>
        )}
      </div>

      {seleccionados.length > 0 && (
        <div className="sticky top-20 z-20 flex flex-wrap items-center justify-between gap-3 rounded-full bg-acento-oscuro py-2 pr-2 pl-5 text-sm text-white shadow-[0_18px_36px_-18px_rgb(19_48_61/0.8)] lg:top-4">
          <span>
            {seleccionados.length} {seleccionados.length === 1 ? "seleccionado" : "seleccionados"}
          </span>
          <div className="flex gap-2">
            <button className="min-h-10 rounded-full px-4 hover:bg-white/10" onClick={() => setSeleccion(new Set())}>
              Quitar selección
            </button>
            <button className="min-h-10 rounded-full bg-[#b8483c] px-4 font-semibold hover:bg-[#963a31]" onClick={() => borrar(seleccionados)}>
              Eliminar
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <Panel>
          <EmptyState title="Aún no hay productos en el catálogo" text="Crea el primero para que los clientes puedan elegirlo al pedir su retrato.">
            <button className={btn.primary} onClick={() => setModal({ producto: null })}>
              <Plus size={17} aria-hidden="true" /> Nuevo producto
            </button>
          </EmptyState>
        </Panel>
      ) : visibles.length === 0 ? (
        <Panel>
          <EmptyState compact title="Ningún producto coincide" text="Prueba con otra técnica o borra la búsqueda." />
        </Panel>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((p) => (
            <TarjetaProducto
              key={p.id}
              p={p}
              marcado={seleccion.has(p.id)}
              menuAbierto={menu === p.id}
              comision={cobros.comision}
              abono={cobros.abono}
              onSeleccion={alternarSeleccion}
              onEditar={abrirEditar}
              onDuplicar={abrirDuplicarEst}
              onMenu={setMenu}
              onAlternar={alternarEst}
              onBorrar={borrarEst}
            />
          ))}
        </ul>
      )}

      {mensaje && (
        <Toast tipo={mensaje.tipo} onClose={() => setMensaje(null)}>
          {mensaje.texto}
        </Toast>
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
        <div className={modalOverlay} onClick={(e) => e.target === e.currentTarget && setDup(null)}>
          <form onSubmit={duplicar} className={`max-w-md space-y-5 p-6 ${modalPanel}`}>
            <h2 className="font-display text-2xl text-tinta">
              Duplicar {dup.name ? `${dup.name} · ` : ""}{dup.technique_name}{cantidadTxt(dup, " · ")}
              {dup.size_label ? ` · ${dup.size_label}` : ""}
            </h2>
            <label className="block text-sm text-tinta/75">
              Copiar a la técnica
              <select className={`mt-1.5 ${inputClass}`} value={destino} onChange={(e) => setDestino(e.target.value)}>
                <option value="">Elige una...</option>
                {tecnicas
                  .filter((t) => t.id !== dup.technique_id && t.has_size === dup.has_size)
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
              </select>
              <span className="mt-1 block text-xs text-tinta/50">Solo aparecen técnicas del mismo tipo (con o sin medidas).</span>
            </label>
            <label className="block text-sm text-tinta/75">
              Ajuste de precio (%)
              <input type="number" className={`mt-1.5 ${inputClass}`} value={pct} onChange={(e) => setPct(e.target.value)} />
              <span className="mt-1 block text-xs text-tinta/50">0 copia el mismo precio. Se redondea a miles.</span>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className={btn.secondary} onClick={() => setDup(null)}>
                Cancelar
              </button>
              <button type="submit" className={btn.primary}>
                Duplicar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
