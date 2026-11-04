import { IconCheck } from "./iconos";

export default function OpcionCard({ icono, titulo, subtitulo, seleccionada, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={seleccionada}
      className={`relative flex items-center gap-4 rounded-2xl border p-5 text-left transition ${
        seleccionada
          ? "border-[#2d6583] bg-[#f5fafb] ring-1 ring-[#2d6583]"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-[#e6eef2] text-[#2d6583]">
        {icono}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-slate-900">{titulo}</span>
        {subtitulo && <span className="block text-sm text-slate-500">{subtitulo}</span>}
      </span>
      {seleccionada && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#2d6583] text-white">
          <IconCheck className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  );
}