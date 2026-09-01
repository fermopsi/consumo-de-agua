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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className={`mt-1 text-2xl font-bold ${acentoClase}`}>{valor}</p>
      {subtitulo && <p className="mt-0.5 text-sm text-slate-500">{subtitulo}</p>}
    </div>
  );
}
