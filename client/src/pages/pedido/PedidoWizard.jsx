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

  if (cargando)
    return <p className="p-10 text-center text-slate-500">Cargando...</p>;
  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;
  if (estilos.length === 0) {
    return (
      <p className="p-10 text-center text-slate-600">
        Estamos preparando nuestro catálogo. Vuelve a visitarnos pronto.
      </p>
    );
  }

  

  const [titulo, subtitulo] = TEXTOS[actual.id];

  return (
    <main className="bg-[#e8f0f3] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Progreso pasos={pasos} actual={paso} />

        <section className="mx-auto mt-8 max-w-3xl rounded-[2rem] border border-slate-200 bg-white px-6 py-10 sm:px-12">
          <p className="text-center text-[11px] font-bold tracking-[0.2em] text-[#2d6583]">
            PASO {paso + 1} DE {pasos.length}
          </p>
          <h1 className="mt-4 text-center text-3xl text-[#1d4e68] sm:text-4xl">
            {titulo}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-center text-slate-500">
            {subtitulo}
          </p>

          <div className="mt-10">
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
                />
              ) : (
                <p className="rounded-2xl bg-amber-50 p-6 text-center text-sm text-amber-800">
                  Esta opción ya no está disponible. Vuelve atrás y elige otra.
                </p>
              ))}
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-6">
            <button
              type="button"
              disabled={paso === 0}
              onClick={() => setPaso(paso - 1)}
              className="rounded-full border border-slate-300 px-7 py-3 font-semibold text-[#1d4e68] hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              Anterior
            </button>
            {!ultimo && (
              <button
                type="button"
                disabled={!puedeContinuar}
                onClick={() => setPaso(paso + 1)}
                className="flex items-center gap-2 rounded-full bg-[#2d6583] px-7 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar <IconFlecha />
              </button>
            )}
          </div>
        </section>
      </div>
          {pedido && <PedidoEnviado numero={pedido.orderNumber} />}
    </main>
  );
}
