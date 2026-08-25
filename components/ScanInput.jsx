"use client";

import { useState } from "react";

// OCR runs client-side (Tesseract.js) to avoid serverless function timeouts.
// Barcode lookup and scoring happen via the API routes below.

export default function ScanInput() {
  const [barcode, setBarcode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done
  const [result, setResult] = useState(null);

  async function handleBarcodeSubmit() {
    setStatus("loading");
    const res = await fetch(`/api/barcode/${barcode}`);
    const data = await res.json();
    setResult(data);
    setStatus("done");
  }

  // TODO: add OCR upload path using dynamic import("tesseract.js")
  // so it's excluded from the server bundle.

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
      <label className="text-sm text-[var(--text-dim)]">Barcode number</label>
      <div className="mt-2 flex gap-2">
        <input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="8901234567890"
          className="flex-1 rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={handleBarcodeSubmit}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#0d1117] hover:opacity-90"
        >
          Look up
        </button>
      </div>
      {status === "loading" && <p className="mt-4 text-sm text-[var(--text-dim)]">Looking up…</p>}
      {result && (
        <pre className="mt-4 overflow-auto rounded-md bg-black/30 p-3 text-xs text-[var(--text-dim)]">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
