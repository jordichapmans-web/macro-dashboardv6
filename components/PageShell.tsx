export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0B0F14] text-neutral-100 flex-1">
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>}
        </header>
        {children}
      </div>
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-sm ${className}`}>
      {title && <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-4">{title}</h3>}
      {children}
    </div>
  );
}
