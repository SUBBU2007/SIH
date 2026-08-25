import ScanInput from "@/components/ScanInput";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">LabelSense</h1>
      <p className="mt-2 text-[var(--text-dim)]">
        Scan a barcode or a label photo. Get a transparent score, not a mystery grade.
      </p>
      <div className="mt-10">
        <ScanInput />
      </div>
    </main>
  );
}
