import ScanInput from "@/components/ScanInput";

export default function ScanPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Scan a product</h1>
      <p className="mt-2 text-[var(--text-dim)]">
        Enter a barcode, upload a label photo, or both.
      </p>
      <div className="mt-10">
        <ScanInput />
      </div>
    </main>
  );
}