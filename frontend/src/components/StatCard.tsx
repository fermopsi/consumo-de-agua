interface Props {
  titulo: string;
  valor: string;
  subtitulo?: string;
  acento?: "default" | "up" | "down";
}

export default function StatCard({ titulo, valor, subtitulo, acento = "default" }: Props) {
  const acentoClase =
    acento === "up" ? "text-emerald-600" : acento === "down" ? "text-red-600" : "text-water-700";

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
        {titulo}
      </p>
      <p className={`mt-1 truncate text-lg font-bold sm:text-2xl ${acentoClase}`}>{valor}</p>
      {subtitulo && (
        <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">{subtitulo}</p>
      )}
    </div>
  );
}
