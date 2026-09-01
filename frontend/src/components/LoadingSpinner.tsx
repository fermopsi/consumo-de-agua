interface Props {
  label?: string;
}

export default function LoadingSpinner({ label = "Consultando..." }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-water-200 border-t-water-600" />
      <span className="text-sm text-ink-soft">{label}</span>
    </div>
  );
}
