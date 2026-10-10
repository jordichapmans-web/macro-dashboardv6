import { PageShell, Card } from "@/components/PageShell";

const PLANNED_SECTIONS = [
  { title: "Fundamentals", detail: "Founder/CEO track record, current & quick ratio, EBITDA, solvency, profitability." },
  { title: "Valuation", detail: "P/E, P/B, EV/EBITDA relative to sector history and peers." },
  { title: "Dividend analysis", detail: "Yield, payout ratio, growth streak — for investors using stocks as an income source." },
  { title: "Earnings expectations", detail: "Revenue minus expenses = net profit, and how actual results land versus consensus." },
  { title: "Sector strength", detail: "Pulled directly from the Sector Rotation page — a company inherits its sector's macro regime." },
  { title: "Macro sensitivity", detail: "How exposed is this specific company to rates, oil, the dollar, or the current quadrant." },
];

export default function CompaniesPage() {
  return (
    <PageShell
      title="Companies"
      subtitle="The bottom of the top-down flow: Macro → Cycle → Allocation → Sector → Industry → Company."
    >
      <Card className="mb-8">
        <p className="text-sm text-neutral-300 leading-relaxed">
          Every other page in this platform earns its place by feeding into this one: once you know the
          cycle, the favored sectors, and the regime, this is where you'd evaluate whether a specific
          company inside that sector is actually worth owning. That's deliberately not built yet — it needs
          its own reliable data source (SEC filings, a fundamentals API) and is a similarly-sized project to
          everything else in this platform so far.
        </p>
      </Card>

      <h2 className="text-sm font-mono uppercase tracking-widest text-neutral-400 mb-4">Planned for this page</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLANNED_SECTIONS.map((s) => (
          <Card key={s.title} title={s.title}>
            <p className="text-sm text-neutral-300 leading-relaxed">{s.detail}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
