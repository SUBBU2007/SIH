// app/scan/photo/page.js
import ScanInput from "@/components/ScanInput";
import HelpBox from "@/components/HelpBox";
import Link from "next/link";

export default function PhotoScanPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/scan" className="text-sm text-[var(--ink-dim)] hover:text-[var(--ink)]">← Back to scan options</Link>
      <h1 className="font-display text-2xl font-medium tracking-tight">Scan a label photo</h1>
      <div className="mt-6">
        <HelpBox title="How this works" steps={[
          "Take a clear, well-lit photo of the nutrition facts panel - flat, no glare, filling the frame.",
          "Upload it here. We read the values automatically.",
          "Give it a product name, there's no barcode to identify it by.",
        ]} />
        <ScanInput mode="photo" />
      </div>
    </main>
  );
}