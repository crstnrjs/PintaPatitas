import { ShimmerButton } from "@/components/ui/shimmer-button";
import { useNavigate } from "react-router-dom";
import {
  SparklesIcon,
  PencilSquareIcon,
  CameraIcon,
  MapPinIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { PawPrintIcon } from "lucide-react";

const photos = {
  artist:
    "https://images.unsplash.com/photo-1604227004936-3dae8bdc3c47?auto=format&fit=crop&w=1400&q=88",
  drawing:
    "https://images.unsplash.com/photo-1733212697044-cfe8043a1655?auto=format&fit=crop&w=1200&q=88",
  dog: "https://images.unsplash.com/photo-1646328699467-29275c39f995?auto=format&fit=crop&w=1000&q=88",
  dogDark:
    "https://images.unsplash.com/photo-1673487069559-03e25ecc1114?auto=format&fit=crop&w=1200&q=88",
  dogSoft:
    "https://images.unsplash.com/photo-1673454316158-a5f11e2c8a11?auto=format&fit=crop&w=1000&q=88",
  cat: "https://images.unsplash.com/photo-1611762989703-4a806a9c61b2?auto=format&fit=crop&w=1000&q=88",
  terrier:
    "https://images.unsplash.com/photo-1611172328667-a9780df508f6?auto=format&fit=crop&w=1000&q=88",
  golden:
    "https://images.unsplash.com/photo-1504430225224-21a649ac91bc?auto=format&fit=crop&w=1000&q=88",
  pair: "https://images.unsplash.com/photo-1724367281416-cf18867ad712?auto=format&fit=crop&w=1000&q=88",
  blackDog:
    "https://images.unsplash.com/photo-1583359481298-37705321bd86?auto=format&fit=crop&w=1000&q=88",
};

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <>
      {" "}
      {/*banner*/}
      <section>
        <div className="w-full px-5 md:px-10 py-15 flex flex-col md:flex-row md:justify-between items-center justify-center gap-20">
          {/*Text banner */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-row items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-primary" />
              <p className="text-xs md:text-sm font-bold text-primary">
                RETRATOS HECHOS EN CHILE
              </p>
            </div>
            <h1 className="text-4xl md:text-7xl text-primary mt-4 font-extrabold">
              Tu mascota convertida en pintura
            </h1>
            <p className="text-[16px] md:text-xl text-gray-600 mt-4">
              Retratos personalizados hechos para ti, con el estilo y tamaño que
              prefieras.
            </p>
            <div className="mt-6 flex flex-col items-center gap-4 md:flex-row md:items-start">
              <ShimmerButton
                className="hover:scale-103 duration-300"
                onClick={() => navigate("/catalogo")}
              >
                Comprar ahora
              </ShimmerButton>
            </div>
          </div>
          {/*Img banner */}
          <div className="relative h-105 w-full pb-7.5 pl-7.5 md:h-147.5 md:flex-1">
            {/* forma de fondo */}
            <div className="absolute top-11.25 right-9.5 bottom-0 left-0 z-0 rounded-tl-[160px] rounded-tr-[30px] rounded-br-[90px] rounded-bl-[40px] bg-mist" />

            {/* foto */}
            <img
              src="/img/banner.webp"
              alt="Artista dibujando el retrato de una mascota"
              className="relative z-10 h-full w-full rounded-tl-[180px] rounded-tr-[30px] rounded-br-[90px] rounded-bl-[40px] object-cover object-[58%_center]"
            />

            {/* tarjeta flotante */}
            <div className="absolute bottom-0 left-0 z-20 rounded-[18px] border border-line bg-white px-6 py-4.5 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
              <span className="mb-1.25 block text-[10px] font-extrabold tracking-widest text-mid uppercase">
                Una pieza única
              </span>
              <strong className="text-sm leading-[1.35]">
                Hecha especialmente
                <br />
                para tu mascota
              </strong>
            </div>
          </div>
        </div>

        <hr className="border-0.5 border-black/20 w-[70%] m-0 mx-auto my-5" />
      </section>
      {/*Pasos para agendar*/}
      <section>
        <div className="px-15 md:py-15 flex flex-col gap-10 ">
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-3xl text-primary">¿Como pido mi pintura?</h2>
            <p className="text-gray-500/90">
              Desde tu primera foto, hasta el cuadro de tu mascota, te
              acompañamos en cada paso del proceso.
            </p>
          </div>
          <div className="flex flex-col gap-8 justify-center mt-6 md:flex-row md:gap-12">
            <div className="flex-1 items-center justify-between gap-2 md:w-[70%] bg-white p-5 rounded-2xl shadow-lg  hover:scale-110 duration-300 m-0 mx-auto">
              <div className="flex flex-row items-center justify-between gap-2 pb-5">
                <div className="flex flex-row-reverse gap-1">
                  <h2 className="text-md font-bold text-animate-secondary">
                    01
                  </h2>
                  <PawPrintIcon className=" text-animate-secondary" />
                </div>
                <div className="flex items-center justify-center p-1 rounded-md bg-animate-primary">
                  <PencilSquareIcon className="h-6 w-6 text-incon" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  Elije tu estilo
                </h3>
                <p className="text-gray-500/90">
                  Escoge formato, técnica y tamaño.
                </p>
              </div>
            </div>

            <div className="flex-1 items-center justify-between gap-2 md:w-[70%] bg-white p-5 rounded-2xl shadow-lg  hover:scale-110 duration-300 m-0 mx-auto">
              <div className="flex flex-row items-center justify-between gap-2 pb-5">
                <div className="flex flex-row-reverse gap-1">
                  <h2 className="text-md font-bold text-animate-secondary">
                    02
                  </h2>
                  <PawPrintIcon className=" text-animate-secondary" />
                </div>
                <div className="flex items-center justify-center p-1 rounded-md bg-animate-primary">
                  <SparklesIcon className="h-6 w-6 text-incon" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  Cuéntanos tu idea
                </h3>
                <p className="text-gray-500/90">
                  Comparte lo que hace única a tu mascota.
                </p>
              </div>
            </div>

            <div className="flex-1 items-center justify-between gap-2 md:w-[70%] bg-white p-5 rounded-2xl shadow-lg  hover:scale-110 duration-300 m-0 mx-auto">
              <div className="flex flex-row items-center justify-between gap-2 pb-5">
                <div className="flex flex-row-reverse gap-1">
                  <h2 className="text-md font-bold text-animate-secondary">
                    03
                  </h2>
                  <PawPrintIcon className=" text-animate-secondary" />
                </div>
                <div className="flex items-center justify-center p-1 rounded-md bg-animate-primary">
                  <CameraIcon className="h-6 w-6 text-incon" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  Envía las fotos
                </h3>
                <p className="text-gray-500/90">
                  Selecciona tus imágenes favoritas.
                </p>
              </div>
            </div>

            <div className="flex-1 items-center justify-between gap-2 md:w-[70%] bg-white p-5 rounded-2xl shadow-lg  hover:scale-110 duration-300 m-0 mx-auto">
              <div className="flex flex-row items-center justify-between gap-2 pb-5">
                <div className="flex flex-row-reverse gap-1">
                  <h2 className="text-md font-bold text-animate-secondary">
                    04
                  </h2>
                  <PawPrintIcon className=" text-animate-secondary" />
                </div>
                <div className="flex items-center justify-center p-1 rounded-md bg-animate-primary">
                  <MapPinIcon className="h-6 w-6 text-incon" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  Recibe tu obra
                </h3>
                <p className="text-gray-500/90">
                  La enviamos protegida a todo Chile.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-background-secondary mt-15">
        <div className=" py-25 flex flex-col-reverse md:flex-row gap-35 w-[80%] mx-auto justify-center">
          <div className="flex-1 h-[80%]">
            <div className="relative h-full">
              {/* foto */}
              <img
                src="/img/Mqumascota.webp"
                alt="Artista dibujando el retrato de una mascota"
                className="shadow-lg shadow-black/60 relative z-10 h-full w-full aspect-3/4 rounded-tl-[30px] rounded-tr-[180px] rounded-br-[90px] rounded-bl-[40px] object-cover object-[58%_center]"
              />

              {/* etiqueta */}
              <div className="group absolute z-20 bottom-6 -right-4 flex items-center gap-2 rounded-full bg-white px-5 py-3 shadow-md hover:scale-105 duration-300">
                <HeartIcon className="h-5 w-5 text-red-600 transition-colors group-hover:fill-red-600 group-hover:animate-pop" />
                <span className="text-sm font-semibold text-primary">
                  Cada detalle importa
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-10">
            <div className="flex flex-col gap-5">
              <h2 className="text-5xl text-white">Hecho para tu mascota</h2>
              <p className="text-lg text-white/70">
                Cada obra comienza con las fotografías y la idea que tú
                imaginas. No repetimos fórmulas: retratamos su esencia.
              </p>
            </div>
            <div className="flex flex-col gap-5 md:flex-col md:gap-5">
              <div className="flex flex-row gap-5 align-center items-center bg-white/10 p-2 rounded-xl shadow-lg border border-white/20">
                <div className="flex items-center justify-center p-1 rounded-md bg-white/10">
                  <SparklesIcon className="h-6 w-6 text-white " />
                </div>
                <div>
                  <h3 className="text-md text-white">Tu mascota</h3>
                  <p className="text-white/70 text-sm">
                    Sus gestos y personalidad.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-5 align-center items-center bg-white/10 p-2 rounded-xl shadow-lg border border-white/20">
                <div className="flex items-center justify-center p-1 rounded-md bg-white/10">
                  <PencilSquareIcon className="h-6 w-6 text-white " />
                </div>
                <div>
                  <h3 className="text-md text-white">Tu estilo</h3>
                  <p className="text-white/70 text-sm">
                    La técnica que más te guste.
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-5 align-center items-center bg-white/10 p-2 rounded-xl shadow-lg border border-white/20">
                <div className="flex items-center justify-center p-1 rounded-md bg-white/10">
                  <HeartIcon className="h-6 w-6 text-white " />
                </div>
                <div>
                  <h3 className="text-md text-white">Tu historia</h3>
                  <p className="text-white/70 text-sm">
                    Un recuerdo para siempre.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="my-5 md:my-10 p-10">
        <div className="mx-auto px-8 py-8 md:px-15 md:py-15 flex w-full flex-col gap-8 md:flex-row md:justify-between items-center justify-center bg-background-secondary/90 rounded-3xl">
          <div className="flex-2 flex-col gap-5 text-center md:text-left">
            <h3 className="text-xs md:text-sm text-white/85 text-left font-mono font-bold">
              TU IDEA, NUESTRA PRÓXIMA OBRA
            </h3>
            <h2 className="text-xl md:text-4xl text-white text-left font-bold">
              ¿Listo para crear una pintura de tu mascota?
            </h2>
            <p className="text-white/65 text-left">
              Cuéntanos cómo la imaginas y preparemos algo único.
            </p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-5 md:flex-row ">
            <ShimmerButton
              className="bg-background text-primary hover:scale-105 duration-300 border border-black/50"
              onClick={() => navigate("/catalogo")}
            >
              Crear mi pintura
            </ShimmerButton>
          </div>
        </div>
      </section>
    </>
  );
}
