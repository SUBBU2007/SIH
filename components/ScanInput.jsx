"use client";

import { useState } from "react";

export default function ScanInput() {
  const [barcode, setBarcode] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [product, setProduct] = useState(null);
  const [score, setScore] = useState(null);
  const [ocrValues, setOcrValues] = useState(null);

  // Very simple line-by-line parser for common label wording.
  // Good enough for your curated demo set — tighten patterns as you test real photos.

  async function runOcr(file) {
    const Tesseract = (await import("tesseract.js")).default;
    const { data } = await Tesseract.recognize(file, "eng");

    // Reconstruct actual table rows from word positions — raw text order
    // from multi-column tables is unreliable, this isn't.
    const rows = [];
    const tolerance = 12; // px — words within this y-range count as the same row
    data.words.forEach((w) => {
      const yCenter = (w.bbox.y0 + w.bbox.y1) / 2;
      let row = rows.find((r) => Math.abs(r.y - yCenter) < tolerance);
      if (!row) {
        row = { y: yCenter, words: [] };
        rows.push(row);
      }
      row.words.push(w);
    });
    const lines = rows
      .sort((a, b) => a.y - b.y)
      .map((r) =>
        r.words
          .sort((a, b) => a.bbox.x0 - b.bbox.x0)
          .map((w) => w.text)
          .join(" "),
      );

    const findValue = (keyword) => {
      const line = lines.find((l) => new RegExp(keyword, "i").test(l));
      if (!line) return null;
      const nums = line.match(/\d+(\.\d+)?/g);
      return nums ? parseFloat(nums[nums.length - 1]) : null; // rightmost number = the per-100g column
    };

    return {
      sugar_g: findValue("sugar"),
      sodium_mg: findValue("sodium"),
      protein_g: findValue("protein"),
      sat_fat_g: findValue("saturated"),
    };
  }

  async function handleSubmit() {
    setStatus("loading");
    setScore(null);
    setOcrValues(null);

    let lookup = null;
    if (barcode) {
      const lookupRes = await fetch(`/api/barcode/${barcode}`);
      const data = await lookupRes.json();
      if (data.found) lookup = data;
    }

    let ocr = null;
    if (imageFile) {
      ocr = await runOcr(imageFile);
      setOcrValues(ocr);
    }

    if (!lookup && !ocr) {
      setStatus("error");
      setProduct(null);
      return;
    }

    const nutritionPer100 = lookup ? lookup.nutritionPer100 : ocr;
    setProduct(lookup || { productName: "Scanned label (no barcode)" });

    const hasBothSources = Boolean(lookup && ocr);

    const scoreRes = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: lookup ? lookup.productName : "Scanned label",
        category: "unknown",
        source: { barcodeUsed: Boolean(lookup), ocrUsed: Boolean(ocr) },
        nutritionPer100,
        reconciliation: hasBothSources
          ? { hasBothSources: true, barcodeValues: lookup.nutritionPer100, ocrValues: ocr }
          : { hasBothSources: false },
      }),
    });
    const scored = await scoreRes.json();
    setScore(scored);
    setStatus("done");
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
      <label className="text-sm text-[var(--text-dim)]">Barcode number (optional)</label>
      <input
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        placeholder="8901234567890"
        className="mt-2 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
      />

      <label className="mt-4 block text-sm text-[var(--text-dim)]">Label photo (optional)</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
        className="mt-2 w-full text-sm"
      />

      <button
        onClick={handleSubmit}
        className="mt-4 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#0d1117] hover:opacity-90"
      >
        Scan
      </button>

      {status === "loading" && <p className="mt-4 text-sm text-[var(--text-dim)]">Scanning…</p>}
      {status === "error" && <p className="mt-4 text-sm text-red-400">Nothing found — check the barcode or photo.</p>}

      {product && score && (
        <div className="mt-6 space-y-4">
          <div>
            <p className="text-lg font-medium">{product.productName}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-semibold text-[var(--accent)]">{score.overallScore}</span>
              <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs">{score.grade}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(score.metricScores).map(([key, val]) => (
              <div key={key} className="rounded-md bg-black/20 px-3 py-2">
                <span className="text-[var(--text-dim)]">{key}</span>
                <span className="float-right">{Math.round(val)}</span>
              </div>
            ))}
          </div>

          {score.mismatchCheck.hasMismatch && (
            <div className="rounded-md border border-yellow-600/40 bg-yellow-600/10 px-3 py-2 text-xs text-yellow-300">
              Mismatch ({score.mismatchCheck.severity}): {score.mismatchCheck.fields.map((f) => f.field).join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}