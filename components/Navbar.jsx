import Link from "next/link";
import { ScanLine } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="border-b border-[var(--line)] bg-[var(--bg)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display flex items-center gap-2 text-lg font-medium tracking-tight text-[var(--ink)]">
          <ScanLine size={20} className="text-[var(--accent)]" />
          LabelSense
        </Link>
        <div className="flex gap-6 text-sm text-[var(--ink-dim)]">
          <Link href="/" className="hover:text-[var(--ink)]">Home</Link>
          <Link href="/scan" className="hover:text-[var(--ink)]">Scan</Link>
          <Link href="/compare" className="hover:text-[var(--ink)]">Compare</Link>
        </div>
      </div>
    </nav>
  );
}