interface Props {
  titulo: string;
  valor: string;
  subtitulo?: string;
  acento?: "default" | "up" | "down";
}

export default function StatCard({ titulo, valor, subtitulo, acento = "default" }: Props) {
  const tickClass = acento === "up" ? "bg-clay" : acento === "down" ? "bg-moss" : "bg-water-600";

  return (
    <div className="min-w-0">
      <div className={`mb-2 h-[3px] w-4 ${tickClass}`} />
      <p className="truncate font-mono text-lg font-semibold text-ink sm:text-xl">{valor}</p>
      <p className="truncate text-xs text-ink-soft">{titulo}</p>
      {subtitulo && <p className="mt-0.5 truncate text-[11px] text-ink-soft">{subtitulo}</p>}
    </div>
  );
}
