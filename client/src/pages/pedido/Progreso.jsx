export default function Progreso({ pasos, actual }) {
  const pct = ((actual + 1) / pasos.length) * 100;
  return (
    <div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-300/70">
        <div
          className="h-full rounded-full bg-[#2d6583] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="mt-3 hidden justify-between text-xs sm:flex">
        {pasos.map((p, i) => (
          <li
            key={p.id}
            className={
              i === actual ? "font-bold text-[#1d4e68]" : i < actual ? "text-slate-600" : "text-slate-400"
            }
          >
            {p.nombre}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-center text-xs font-semibold text-[#1d4e68] sm:hidden">
        {pasos[actual].nombre}
      </p>
    </div>
  );
}