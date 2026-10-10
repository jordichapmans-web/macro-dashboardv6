import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Aion",
  description: "Top-down macroeconomic analysis for long-term investors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex bg-[#0B0F14]">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </body>
    </html>
  );
}
