"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Clock,
  RotateCw,
  Landmark,
  Coins,
  FileText,
  Building2,
  History,
  FlaskConical,
  BellRing,
} from "lucide-react";
import { GetNotifiedModal } from "./GetNotifiedModal";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invest", label: "What Should I Invest In?", icon: TrendingUp },
  { href: "/cycle", label: "Economic Cycle", icon: Clock },
  { href: "/sectors", label: "Sector Rotation", icon: RotateCw },
  { href: "/bonds", label: "Bonds & Recession Risk", icon: Landmark },
  { href: "/signals", label: "Cross-Asset Signals", icon: Coins },
  { href: "/narrative", label: "Market Narrative", icon: FileText },
  { href: "/backtest", label: "Backtest Strategy", icon: FlaskConical },
  { href: "/update-log", label: "Update Log", icon: History },
  { href: "/companies", label: "Companies", icon: Building2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [notifyOpen, setNotifyOpen] = useState(false);

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-neutral-800 bg-[#0B0F14] h-screen sticky top-0 px-4 py-6">
      <div className="mb-8 px-2">
        <p className="text-sm font-semibold tracking-tight text-neutral-100">Aion</p>
        <p className="text-xs text-neutral-500 mt-0.5">Top-down investing</p>
      </div>

      <button
        onClick={() => setNotifyOpen(true)}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm mb-3 bg-neutral-800/80 text-neutral-100 hover:bg-neutral-800 transition-colors"
      >
        <BellRing size={16} strokeWidth={1.75} />
        Get Notified
      </button>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-neutral-800 text-neutral-100"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 py-3 rounded-lg bg-neutral-900/60 text-[11px] text-neutral-500 leading-relaxed">
        Educational macro analysis only — not investment advice.
      </div>
      <Link href="/admin/login" className="mt-3 px-3 text-[10px] text-neutral-700 hover:text-neutral-500 transition-colors">
        Owner login
      </Link>

      {notifyOpen && <GetNotifiedModal onClose={() => setNotifyOpen(false)} />}
    </aside>
  );
}
