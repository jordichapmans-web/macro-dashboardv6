export function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900/80 px-5 py-4 text-sm text-neutral-300 leading-relaxed mb-8">
      {children}
    </div>
  );
}
