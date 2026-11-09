import { useEffect, useMemo, useRef, useState } from "react";
import { IconFlecha } from "./iconos";
import Progreso from "./Progreso";
import { useCatalogoPublico } from "./useCatalogoPublico";
import { StepEstilo, StepFormato, StepIdea, StepMascotas } from "./pasos";
import StepFotos from "./StepFotos";
import StepContacto, {
  CONTACTO_INICIAL,
  validarContacto,
} from "./StepContacto";
import StepResumen from "./StepResumen";
import { armarFormData, enviarPedido } from "./enviar";
import PedidoEnviado from "./PedidoEnviado";


const TEXTOS = {
  estilo: [
    "Elige tu estilo",
    "Cada técnica le da una personalidad distinta a tu retrato.",
  ],
  formato: [
    "Elige tu formato",
    "Selecciona el tamaño que mejor se adapte a tu espacio.",
  ],
  mascotas: [
    "¿Cuántas mascotas?",
    "Puedes reunir a tus compañeros en una misma obra.",
  ],
  idea: [
    "Cuéntanos cómo imaginas tu pintura",
    "Describe el fondo, los detalles o lo que quieras destacar. Cualquier idea ayuda.",
  ],
  fotos: [
    "Fotografías de tu mascota",
    "Sube fotos claras para que podamos retratarla.",
  ],
  contacto: ["Tus datos", "Para contactarte y coordinar el envío."],
  resumen: [
    "Resumen de tu pedido",
    "Revisa que todo esté bien antes de enviar.",
  ],
};

const INICIAL = {
  tecnicaId: null,
  formato: null,
  mascotas: null,
  nombres: [],
  idea: "",
  fotos: [],
  contacto: CONTACTO_INICIAL,
  aceptaEnvio: false,
};

export default function PedidoWizard() {
  const { cargando, error, estilos, formatosDe, productosDe } =
    useCatalogoPublico();
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState(INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [pedido, setPedido] = useState(null); // { orderNumber }

  // Libera las vistas previas de las fotos al salir del flujo
  const fotosRef = useRef([]);
  fotosRef.current = datos.fotos;
  useEffect(
    () => () => fotosRef.current.forEach((f) => URL.revokeObjectURL(f.preview)),
    [],
  );

  const estilo = estilos.find((e) => e.id === datos.tecnicaId);
  const conFormato = estilo ? estilo.has_size : true;

  const pasos = useMemo(
    () => [
      { id: "estilo", nombre: "Estilo" },
      ...(conFormato ? [{ id: "formato", nombre: "Formato" }] : []),
      { id: "mascotas", nombre: "Mascotas" },
      { id: "idea", nombre: "Tu idea" },
      { id: "fotos", nombre: "Fotografías" },
      { id: "contacto", nombre: "Contacto" },
      { id: "resumen", nombre: "Resumen" },
    ],
    [conFormato],
  );

  const actual = pasos[paso];
  const ultimo = paso === pasos.length - 1;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [paso]);

  const productos = estilo
    ? productosDe(
        estilo.id,
        datos.formato?.ancho ?? null,
        datos.formato?.alto ?? null,
      )
    : [];
  const producto = productos.find((p) => p.pet_count === datos.mascotas);

  const puedeContinuar = {
    estilo: datos.tecnicaId !== null,
    formato: datos.formato !== null,
    mascotas: datos.mascotas !== null,
    idea: true,
    fotos: datos.fotos.length >= 1,
    contacto: Object.keys(validarContacto(datos.contacto)).length === 0,
    resumen: false,
  }[actual.id];

  function elegirEstilo(id) {
    // Cambiar de estilo invalida el formato y la cantidad ya elegidos
    setDatos((d) => ({ ...d, tecnicaId: id, formato: null, mascotas: null }));
  }

  function elegirFormato(f) {
    setDatos((d) => ({ ...d, formato: f, mascotas: null }));
  }

  function agregarFotos(nuevas) {
    setDatos((d) => ({ ...d, fotos: [...d.fotos, ...nuevas] }));
  }

  function quitarFoto(id) {
    const foto = datos.fotos.find((f) => f.id === id);
    if (foto) URL.revokeObjectURL(foto.preview);
    setDatos((d) => ({ ...d, fotos: d.fotos.filter((f) => f.id !== id) }));
  }

  async function enviar() {
    if (enviando || pedido) return;
    setEnviando(true);
    setErrorEnvio("");
    try {
      setPedido(await enviarPedido(armarFormData(datos, estilo)));
    } catch (err) {
      setErrorEnvio(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (cargando || error || estilos.length === 0) {
    return (
      <div className="bg-lino px-4 py-16">
        <p
          role={error ? "alert" : "status"}
          className={`mx-auto max-w-md rounded-2xl bg-papel p-6 text-center ${error ? "text-red-700" : "text-tinta/70"}`}
        >
          {cargando
            ? "Cargando..."
            : error || "Estamos preparando nuestro catálogo. Vuelve a visitarnos pronto."}
        </p>
      </div>
    );
  }

  const [titulo, subtitulo] = TEXTOS[actual.id];

  return (
    <div className="bg-lino px-4 pt-5 pb-12 sm:px-6 sm:pt-10 sm:pb-16">
      <div className="mx-auto max-w-3xl">
        <Progreso pasos={pasos} actual={paso} />

        <section
          aria-labelledby="paso-titulo"
          className="mt-5 rounded-3xl border border-white/80 bg-papel px-4 py-7 shadow-[0_24px_48px_-32px_rgb(27_68_88/0.55)] sm:mt-8 sm:rounded-[2rem] sm:px-10 sm:py-10"
        >
          <header className="px-1 text-center">
            <p className="hidden text-[11px] font-bold tracking-[0.2em] text-acento sm:block">
              PASO {paso + 1} DE {pasos.length}
            </p>
            <h1
              id="paso-titulo"
              className="font-display text-[clamp(1.6rem,6.5vw,2.4rem)] leading-tight text-balance text-tinta sm:mt-3"
            >
              {titulo}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-pretty text-tinta/65 sm:mt-3 sm:text-base">
              {subtitulo}
            </p>
          </header>

          <div className="mt-7 sm:mt-10">
            {actual.id === "estilo" && (
              <StepEstilo
                estilos={estilos}
                seleccionado={datos.tecnicaId}
                onElegir={elegirEstilo}
              />
            )}
            {actual.id === "formato" && (
              <StepFormato
                formatos={formatosDe(datos.tecnicaId)}
                seleccionado={datos.formato}
                onElegir={elegirFormato}
              />
            )}
            {actual.id === "mascotas" && (
              <StepMascotas
                productos={productos}
                seleccionado={datos.mascotas}
                nombres={datos.nombres}
                onElegir={(n) =>
                  setDatos((d) => ({
                    ...d,
                    mascotas: n,
                    // Ajusta la lista de nombres a la cantidad elegida (conserva los ya escritos)
                    nombres: Array.from({ length: n }, (_, i) => d.nombres[i] ?? ""),
                  }))
                }
                onNombres={(nombres) => setDatos((d) => ({ ...d, nombres }))}
              />
            )}
            {actual.id === "idea" && (
              <StepIdea
                valor={datos.idea}
                onChange={(idea) => setDatos((d) => ({ ...d, idea }))}
              />
            )}
            {actual.id === "fotos" && (
              <StepFotos
                fotos={datos.fotos}
                onAgregar={agregarFotos}
                onQuitar={quitarFoto}
              />
            )}
            {actual.id === "contacto" && (
              <StepContacto
                valor={datos.contacto}
                onChange={(contacto) => setDatos((d) => ({ ...d, contacto }))}
              />
            )}
            {actual.id === "resumen" &&
              (producto ? (
                <StepResumen
                  datos={datos}
                  estilo={estilo}
                  producto={producto}
                  onEnviar={enviar}
                  enviando={enviando}
                  aviso={errorEnvio}
                  onAceptaEnvio={(aceptaEnvio) => setDatos((d) => ({ ...d, aceptaEnvio }))}
                />
              ) : (
                <p className="rounded-2xl bg-amber-50 p-6 text-center text-sm text-amber-800">
                  Esta opción ya no está disponible. Vuelve atrás y elige otra.
                </p>
              ))}
          </div>

          <div className="mt-8 flex items-center gap-3 border-t border-tinta/10 pt-5 sm:mt-10 sm:justify-between sm:pt-6">
            <button
              type="button"
              disabled={paso === 0}
              onClick={() => setPaso(paso - 1)}
              className={`min-h-12 rounded-full border border-tinta/20 bg-white px-5 font-semibold text-acento-oscuro transition hover:border-tinta/40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tinta disabled:cursor-not-allowed disabled:border-tinta/10 disabled:bg-transparent disabled:text-tinta/30 sm:px-7 ${
                ultimo ? "w-full sm:w-auto" : ""
              }`}
            >
              Anterior
            </button>
            {!ultimo && (
              <button
                type="button"
                disabled={!puedeContinuar}
                onClick={() => setPaso(paso + 1)}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-acento px-6 font-semibold text-white shadow-[0_4px_0_-1px_var(--color-acento-oscuro)] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_-1px_var(--color-acento-oscuro)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-tinta disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:flex-none sm:px-8"
              >
                Continuar <IconFlecha />
              </button>
            )}
          </div>
        </section>
      </div>
      {pedido && <PedidoEnviado numero={pedido.orderNumber} />}
    </div>
  );
}
