"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function ScanInput() {
  const [barcode, setBarcode] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [product, setProduct] = useState(null);
  const [score, setScore] = useState(null);
  const [ocrValues, setOcrValues] = useState(null);
  const [category, setCategory] = useState("snacks");
  const [aiSummary, setAiSummary] = useState(null);

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
        barcode: barcode || null,
        productName: lookup ? lookup.productName : "Scanned label",
        category: category,
        source: { barcodeUsed: Boolean(lookup), ocrUsed: Boolean(ocr) },
        nutritionPer100,
        reconciliation: hasBothSources
          ? { hasBothSources: true, barcodeValues: lookup.nutritionPer100, ocrValues: ocr }
          : { hasBothSources: false },
      }),
    });
    const scored = await scoreRes.json();
    setScore(scored);
    const explainRes = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: lookup ? lookup.productName : "Scanned label",
        overallScore: scored.overallScore,
        grade: scored.grade,
        nutritionPer100,
        whyThisResult: scored.explainability.whyThisResult,
      }),
    });
    const explained = await explainRes.json();
    setAiSummary(explained.aiSummary);

    setStatus("done");
  }

    return (
      <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] p-6">
        <label className="text-sm text-[var(--ink-dim)]">
          Barcode number (optional)
        </label>
        <input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="8901234567890"
          className="font-mono mt-2 w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <label className="mt-4 block text-sm text-[var(--ink-dim)]">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-2 w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        >
          <option value="snacks">Snacks</option>
          <option value="beverages">Beverages</option>
          <option value="dairy">Dairy</option>
          <option value="instant_food">Instant food</option>
          <option value="cereals">Cereals</option>
        </select>

        <label className="mt-4 block text-sm text-[var(--ink-dim)]">
          Label photo (optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          className="mt-2 w-full text-sm"
        />

        <button
          onClick={handleSubmit}
          className="mt-4 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Scan
        </button>

        {status === "loading" && (
          <p className="mt-4 text-sm text-[var(--ink-dim)]">Scanning…</p>
        )}
        {status === "error" && (
          <p className="mt-4 text-sm text-[var(--alert)]">
            Nothing found — check the barcode or photo.
          </p>
        )}

        {product && score && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-6 overflow-hidden rounded-md border-2 border-[var(--ink)]"
          >
            {/* Nutrition-panel signature: thick rule, header row, tabular data */}
            <div className="border-b-2 border-[var(--ink)] bg-[var(--bg-elevated)] px-4 py-3">
              <p className="font-display text-base font-medium">
                {product.productName}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className="font-mono text-3xl font-semibold"
                  style={{
                    color:
                      score.overallScore >= 60
                        ? "var(--good)"
                        : score.overallScore >= 40
                          ? "var(--warn)"
                          : "var(--alert)",
                  }}
                >
                  {score.overallScore}
                </span>
                <span className="text-sm text-[var(--ink-dim)]">
                  / 100 — {score.grade}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--ink-dim)]">
                {score.recommendations.defaultSummary}
              </p>
              {aiSummary && <p className="mt-1 text-sm italic text-[var(--ink-dim)]">{aiSummary}</p>}
            </div>

            <div className="divide-y divide-[var(--line)]">
              <p className="px-4 py-2 text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                Per 100g
              </p>
              {[
                ["Sugar", score.nutritionPer100.sugar_g, "g"],
                ["Sodium", score.nutritionPer100.sodium_mg, "mg"],
                ["Protein", score.nutritionPer100.protein_g, "g"],
                ["Saturated fat", score.nutritionPer100.sat_fat_g, "g"],
              ].map(([label, value, unit], i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.1 + i * 0.05 }}
                  className="flex items-center justify-between px-4 py-2 text-sm"
                >
                  <span className="text-[var(--ink-dim)]">{label}</span>
                  <span className="font-mono">
                    {value ?? "—"} {value != null ? unit : ""}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="border-t border-[var(--line)] px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                Why this result
              </p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--ink-dim)]">
                {score.explainability.whyThisResult.map((line, i) => (
                  <li key={i}>· {line}</li>
                ))}
              </ul>
            </div>

            {score.mismatchCheck.hasMismatch && (
              <div
                className="border-t border-[var(--line)] px-4 py-3 text-xs"
                style={{
                  color: "var(--alert)",
                  background: "rgba(178,59,59,0.06)",
                }}
              >
                Mismatch ({score.mismatchCheck.severity}):{" "}
                {score.mismatchCheck.fields.map((f) => f.field).join(", ")}
              </div>
            )}
          </motion.div>
        )}
      </div>
    );
}