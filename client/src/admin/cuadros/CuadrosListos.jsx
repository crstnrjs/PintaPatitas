import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Eye, EyeOff, Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Aviso,
  EmptyState,
  PageHeader,
  Skeleton,
  Toast,
  btn,
  formatDate,
  inputClass,
  modalOverlay,
  modalPanel,
  money,
} from "@/admin/shared/ui";
import CuadroModal from "./CuadroModal";
import VentasCuadros from "./VentasCuadros";
import { CANALES, ESTADOS, estadoEfectivo, filtroSinCompraEnCurso, fotoUrl, reservaActiva, BUCKET } from "./estados";

const PESTANAS = [
  ["vitrina", "En vitrina"],
  ["vendidos", "Vendidos"],
  ["ventas", "Ventas web y envíos"],
];

const CAMBIO_CONCURRENTE = "El cuadro cambió de estado mientras tanto (quizás alguien lo está comprando). Recargamos la lista.";

function EstadoBadge({ estado }) {
  const e = ESTADOS[estado] ?? ESTADOS.borrador;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${e.className}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${e.dot}`} />
      {e.label}
    </span>
  );
}

const medidas = (c) => (c.ancho_cm && c.alto_cm ? `${Number(c.ancho_cm)} × ${Number(c.alto_cm)} cm` : null);
const hora = (d) => new Date(d).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

export default function CuadrosListos() {
  const [pestana, setPestana] = useState("vitrina");
  const [cuadros, setCuadros] = useState([]);
  const [tecnicas, setTecnicas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editando, setEditando] = useState(undefined); // undefined = cerrado, null = nuevo, objeto = editar
  const [vendiendo, setVendiendo] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [filas, techs] = await Promise.all([
      supabase.from("cuadros_listos").select("*").order("created_at", { ascending: false }),
      supabase.from("techniques").select("id, name, is_active").order("sort_order"),
    ]);
    if (filas.error) {
      const faltaTabla = ["42P01", "PGRST205"].includes(filas.error.code);
      setError(
        faltaTabla
          ? "Falta aplicar la migración de cuadros listos en Supabase (202611070001_cuadros_listos.sql)."
          : `No se pudieron cargar los cuadros. ${filas.error.message}`,
      );
    } else {
      setCuadros(filas.data ?? []);
    }
    if (techs.data) setTecnicas(techs.data);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Cambia el estado solo si el cuadro sigue como lo vemos y nadie lo está comprando.
  async function cambiarEstado(cuadro, cambios, mensaje) {
    setError("");
    const actual = estadoEfectivo(cuadro);
    const { data, error: err } = await supabase
      .from("cuadros_listos")
      .update({ reservado_hasta: null, ...cambios })
      .eq("id", cuadro.id)
      .or(filtroSinCompraEnCurso([actual]))
      .select("id");
    if (err) return setError(`No se pudo actualizar el cuadro: ${err.message}`);
    if (!data?.length) {
      setError(CAMBIO_CONCURRENTE);
    } else {
      setToast(mensaje);
    }
    cargar();
    return Boolean(data?.length);
  }

  function publicar(cuadro) {
    if (!cuadro.fotos?.length) return setError("Agrega al menos una foto antes de publicar el cuadro.");
    cambiarEstado(cuadro, { estado: "disponible" }, "Cuadro publicado en la tienda");
  }

  async function eliminar(cuadro) {
    if (!confirm(`¿Eliminar "${cuadro.titulo}"? Se borrarán también sus fotos. Esta acción no se puede deshacer.`)) return;
    setError("");
    const { data, error: err } = await supabase
      .from("cuadros_listos")
      .delete()
      .eq("id", cuadro.id)
      .or(filtroSinCompraEnCurso(["borrador", "disponible", "oculto"]))
      .select("id");
    if (err) return setError(`No se pudo eliminar: ${err.message}`);
    if (!data?.length) {
      setError(CAMBIO_CONCURRENTE);
      return cargar();
    }
    if (cuadro.fotos?.length) await supabase.storage.from(BUCKET).remove(cuadro.fotos);
    setToast("Cuadro eliminado");
    cargar();
  }

  const lista = cuadros.filter((c) => (pestana === "vendidos" ? c.estado === "vendido" : c.estado !== "vendido"));
  const disponibles = cuadros.filter((c) => estadoEfectivo(c) === "disponible").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuadros listos"
        description="Obras ya pintadas que se venden en «Directo a tu pared». Cada una es única: al venderse sale de la tienda y queda en el historial."
      >
        <button type="button" className={btn.primary} onClick={() => { setError(""); setEditando(null); }}>
          <Plus size={17} aria-hidden="true" /> Agregar cuadro
        </button>
      </PageHeader>

      <div role="tablist" aria-label="Cuadros listos" className="flex flex-wrap items-center gap-2">
        {PESTANAS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={pestana === id}
            onClick={() => setPestana(id)}
            className={`${btn.secondary} ${pestana === id ? "!border-acento !bg-acento/10" : ""}`}
          >
            {label}
            {id !== "ventas" && (
              <span className="rounded-full bg-bruma px-2 text-xs text-tinta/70">
                {cuadros.filter((c) => (id === "vendidos" ? c.estado === "vendido" : c.estado !== "vendido")).length}
              </span>
            )}
          </button>
        ))}
        {!cargando && pestana === "vitrina" && (
          <span className="ml-auto text-sm text-tinta/55">
            {disponibles} {disponibles === 1 ? "cuadro disponible" : "cuadros disponibles"} en la tienda
          </span>
        )}
      </div>

      {error && <Aviso onClose={() => setError("")}>{error}</Aviso>}

      {pestana === "ventas" ? (
        <VentasCuadros onCambio={cargar} />
      ) : cargando ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Cargando cuadros">
          {[0, 1, 2].map((n) => <Skeleton key={n} className="h-96 rounded-[26px]" />)}
        </div>
      ) : lista.length === 0 ? (
        <div className="rounded-[26px] border border-white/80 bg-white/80">
          {pestana === "vendidos" ? (
            <EmptyState title="Aún no hay cuadros vendidos" text="Cuando se venda un cuadro, por la web o por Instagram, aparecerá aquí." />
          ) : (
            <EmptyState title="Todavía no hay cuadros en vitrina" text="Sube las obras que ya están pintadas para venderlas directamente.">
              <button type="button" className={btn.primary} onClick={() => setEditando(null)}>
                <Plus size={17} aria-hidden="true" /> Agregar cuadro
              </button>
            </EmptyState>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((c) => (
            <TarjetaCuadro
              key={c.id}
              cuadro={c}
              tecnica={tecnicas.find((t) => t.id === c.technique_id)?.name}
              onEditar={() => { setError(""); setEditando(c); }}
              onPublicar={() => publicar(c)}
              onOcultar={() => cambiarEstado(c, { estado: "oculto" }, "Cuadro ocultado de la tienda")}
              onVender={() => setVendiendo(c)}
              onDeshacerVenta={() => {
                if (!confirm("¿Deshacer esta venta? El cuadro quedará oculto para que revises si vuelve a la tienda.")) return;
                cambiarEstado(c, { estado: "oculto", vendido_en: null, canal_venta: null }, "Venta deshecha: el cuadro quedó oculto");
              }}
              onEliminar={() => eliminar(c)}
            />
          ))}
        </ul>
      )}

      {toast && <Toast onClose={() => setToast("")}>{toast}</Toast>}

      {editando !== undefined && (
        <CuadroModal
          cuadro={editando}
          tecnicas={tecnicas}
          onClose={() => setEditando(undefined)}
          onSaved={(mensaje) => { setEditando(undefined); setToast(mensaje); cargar(); }}
          onConflicto={() => { setEditando(undefined); setError(CAMBIO_CONCURRENTE); cargar(); }}
        />
      )}

      {vendiendo && (
        <VentaExternaModal
          cuadro={vendiendo}
          onClose={() => setVendiendo(null)}
          onConfirm={async (canal) => {
            await cambiarEstado(
              vendiendo,
              { estado: "vendido", canal_venta: canal, vendido_en: new Date().toISOString() },
              `Cuadro marcado como vendido por ${CANALES[canal]}`,
            );
            setVendiendo(null);
          }}
        />
      )}
    </div>
  );
}

function TarjetaCuadro({ cuadro, tecnica, onEditar, onPublicar, onOcultar, onVender, onDeshacerVenta, onEliminar }) {
  const estado = estadoEfectivo(cuadro);
  const enCompra = reservaActiva(cuadro);
  const portada = cuadro.fotos?.[0];
  const detalle = [tecnica, medidas(cuadro)].filter(Boolean).join(" · ");

  return (
    <li className="flex flex-col overflow-hidden rounded-[26px] border border-white/80 bg-white/85 p-3 shadow-[0_18px_40px_-30px_rgb(19_48_61/0.55)]">
      <div className="relative">
        {portada ? (
          <img src={fotoUrl(portada)} alt={cuadro.titulo} loading="lazy" className="aspect-[4/5] w-full rounded-xl object-cover" />
        ) : (
          <span className="flex aspect-[4/5] w-full items-center justify-center rounded-xl border border-dashed border-tinta/20 text-sm text-tinta/50">
            Sin fotos
          </span>
        )}
        <span className="absolute top-2 left-2"><EstadoBadge estado={estado} /></span>
        {cuadro.fotos?.length > 1 && (
          <span className="absolute right-2 bottom-2 rounded-full bg-tinta/70 px-2 py-0.5 text-xs text-white">
            {cuadro.fotos.length} fotos
          </span>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-tinta">{cuadro.titulo}</h2>
          {detalle && <p className="truncate text-xs text-tinta/55">{detalle}</p>}
        </div>
        <strong className="shrink-0 tabular-nums text-tinta">{money(cuadro.precio)}</strong>
      </div>

      {enCompra && (
        <p className="mt-2 rounded-xl bg-[#faefd9] px-3 py-2 text-xs text-[#865710]">
          Hay una compra en curso hasta las {hora(cuadro.reservado_hasta)}. Mientras tanto no se puede modificar.
        </p>
      )}
      {cuadro.estado === "vendido" && (
        <p className="mt-2 px-1 text-xs text-tinta/60">
          Vendido el {formatDate(cuadro.vendido_en)} · {CANALES[cuadro.canal_venta] ?? cuadro.canal_venta}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
        {cuadro.estado === "vendido" ? (
          cuadro.canal_venta !== "web" && (
            <button type="button" className={btn.secondary} onClick={onDeshacerVenta}>
              <Undo2 size={16} aria-hidden="true" /> Deshacer venta
            </button>
          )
        ) : !enCompra ? (
          <>
            <button type="button" className={btn.secondary} onClick={onEditar} aria-label={`Editar ${cuadro.titulo}`}>
              <Pencil size={16} aria-hidden="true" /> Editar
            </button>
            {estado === "disponible" ? (
              <button type="button" className={btn.secondary} onClick={onOcultar} aria-label={`Ocultar ${cuadro.titulo}`} title="Ocultar de la tienda">
                <EyeOff size={16} aria-hidden="true" />
              </button>
            ) : (
              <button type="button" className={btn.secondary} onClick={onPublicar} aria-label={`Publicar ${cuadro.titulo}`} title="Publicar en la tienda">
                <Eye size={16} aria-hidden="true" />
              </button>
            )}
            <button type="button" className={btn.secondary} onClick={onVender} aria-label={`Marcar ${cuadro.titulo} como vendido fuera de la web`} title="Vendido por Instagram u otro canal">
              <BadgeCheck size={16} aria-hidden="true" />
            </button>
            <button type="button" className={btn.danger} onClick={onEliminar} aria-label={`Eliminar ${cuadro.titulo}`} title="Eliminar">
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>
    </li>
  );
}

function VentaExternaModal({ cuadro, onClose, onConfirm }) {
  const [canal, setCanal] = useState("instagram");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !guardando && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guardando, onClose]);

  async function confirmar(e) {
    e.preventDefault();
    setGuardando(true);
    await onConfirm(canal);
    setGuardando(false);
  }

  return (
    <div className={modalOverlay} role="dialog" aria-modal="true" aria-labelledby="venta-externa-titulo">
      <form onSubmit={confirmar} className={`${modalPanel} max-w-md space-y-4 p-5 sm:p-6`}>
        <h2 id="venta-externa-titulo" className="font-display text-2xl text-tinta">Marcar como vendido</h2>
        <p className="text-sm text-tinta/65">
          «{cuadro.titulo}» saldrá de la tienda y quedará en el historial de vendidos. Úsalo cuando se venda fuera de la web,
          por ejemplo por Instagram.
        </p>
        <label className="block text-sm font-medium">
          ¿Dónde se vendió?
          <select className={`${inputClass} mt-1.5`} value={canal} onChange={(e) => setCanal(e.target.value)}>
            <option value="instagram">Instagram</option>
            <option value="otro">Otro canal (feria, en persona…)</option>
          </select>
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className={btn.secondary} onClick={onClose} disabled={guardando}>Cancelar</button>
          <button type="submit" className={btn.primary} disabled={guardando}>
            {guardando ? "Guardando…" : "Marcar vendido"}
          </button>
        </div>
      </form>
    </div>
  );
}
