// app/scan/barcode/page.js
import ScanInput from "@/components/ScanInput";
import HelpBox from "@/components/HelpBox";
import Link from "next/link";

export default function BarcodeScanPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/scan" className="text-sm text-[var(--ink-dim)] hover:text-[var(--ink)]">← Back to scan options</Link>
      <h1 className="font-display text-2xl font-medium tracking-tight">Scan a barcode</h1>
      <div className="mt-6">
        <HelpBox title="How this works" steps={[
          "Find the barcode number printed under the black lines on the packaging.",
          "Type the number in, no need to scan with a camera.",
          "We look it up instantly against Open Food Facts.",
        ]} />
        <ScanInput mode="barcode" />
      </div>
    </main>
  );
}