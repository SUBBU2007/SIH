// app/scan/verify/page.js
import ScanInput from "@/components/ScanInput";
import HelpBox from "@/components/HelpBox";
import Link from "next/link";

export default function VerifyScanPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/scan" className="text-sm text-[var(--ink-dim)] hover:text-[var(--ink)]">← Back to scan options</Link>
      <h1 className="font-display text-2xl font-medium tracking-tight">Verify with both sources</h1>
      <div className="mt-6">
        <HelpBox title="How this works" steps={[
          "Enter the barcode and upload a label photo, both for the same product.",
          "We cross-check the two - if they disagree on any value, you'll see exactly where.",
          "Use this when you want the highest confidence in the result.",
        ]} />
        <ScanInput mode="verify" />
      </div>
    </main>
  );
}