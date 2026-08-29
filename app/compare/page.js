"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import StarRating from "@/components/StarRating";

const CATEGORIES = ["snacks", "solid"];
const PRIORITIES = {
  overall: { label: "Overall score", key: "foodScore", better: "low" },
  sugar: { label: "Lowest sugar", key: "sugar_g", better: "low" },
  sodium: { label: "Lowest sodium", key: "sodium_mg", better: "low" },
  protein: { label: "Highest protein", key: "protein_g", better: "high" },
};
const METRICS = [
  { key: "sugar_g", label: "Sugar", unit: "g", better: "low" },
  { key: "sodium_mg", label: "Sodium", unit: "mg", better: "low" },
  { key: "protein_g", label: "Protein", unit: "g", better: "high" },
  { key: "sat_fat_g", label: "Sat. fat", unit: "g", better: "low" },
  { key: "fiber_g", label: "Fibre", unit: "g", better: "high" },
  { key: "energy_kcal", label: "Energy", unit: "kcal", better: null },
];

export default function ComparePage() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("snacks");
  const [priority, setPriority] = useState("overall");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  const [quickBarcode, setQuickBarcode] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState("");

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  const inCategory = products.filter((p) => p.category === category);
  const filteredList = inCategory.filter((p) =>
    p.productName.toLowerCase().includes(search.toLowerCase())
  );
  const chosen = inCategory.filter((p) => selected.includes(p._id));

  const ranked = [...chosen].sort((a, b) => {
    const { key, better } = PRIORITIES[priority];
    const va = key === "foodScore" ? a.scoreOutput.foodScore : a.nutritionPer100[key];
    const vb = key === "foodScore" ? b.scoreOutput.foodScore : b.nutritionPer100[key];
    return better === "low" ? va - vb : vb - va;
  });

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function bestValueFor(metric) {
    const values = chosen.map((p) => p.nutritionPer100[metric.key]).filter((v) => v != null);
    if (values.length === 0 || !metric.better) return null;
    return metric.better === "low" ? Math.min(...values) : Math.max(...values);
  }

  async function quickAdd() {
    if (!quickBarcode.trim()) return;
    setQuickLoading(true);
    setQuickError("");
    try {
      const lookupRes = await fetch(`/api/barcode/${encodeURIComponent(quickBarcode.trim())}`);
      const lookup = await lookupRes.json();
      if (!lookup.found) {
        setQuickError("Barcode not found in Open Food Facts.");
        return;
      }
      const scoreRes = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: quickBarcode.trim(),
          productName: lookup.productName,
          category,
          source: { barcodeUsed: true, ocrUsed: false },
          nutritionPer100: lookup.nutritionPer100,
          reconciliation: { hasBothSources: false },
        }),
      });
      const scored = await scoreRes.json();
      if (scored.scoreStatus !== "CALCULATED") {
        setQuickError(`Not scored: ${scored.reason || "unknown reason"}.`);
        return;
      }
      const refreshed = await fetch("/api/products").then((r) => r.json());
      setProducts(refreshed);
      const newProduct = refreshed.find((p) => p.barcode === quickBarcode.trim());
      if (newProduct) setSelected((s) => [...s, newProduct._id]);
      setQuickBarcode("");
    } catch {
      setQuickError("Something went wrong adding this product.");
    } finally {
      setQuickLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-2xl font-medium tracking-tight">Compare products</h1>
      <p className="mt-2 text-[var(--ink-dim)]">
        Pick the products you want to compare, or add one by barcode right here.
      </p>

      <select
        value={category}
        onChange={(e) => { setCategory(e.target.value); setSelected([]); setSearch(""); }}
        className="mt-6 rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm"
      >
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Quick-add by barcode — for a product not yet scanned */}
      <div className="mt-4 flex gap-2">
        <input
          value={quickBarcode}
          onChange={(e) => setQuickBarcode(e.target.value)}
          placeholder="Add by barcode…"
          className="font-mono flex-1 rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={quickAdd}
          disabled={quickLoading}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {quickLoading ? "Adding…" : "Add"}
        </button>
      </div>
      {quickError && <p className="mt-1 text-xs" style={{ color: "var(--alert)" }}>{quickError}</p>}

      {/* Search + checklist */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search scanned products…"
        className="mt-6 w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
      />
      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
        {filteredList.length === 0 && (
          <p className="text-sm text-[var(--ink-dim)]">No matching products yet — scan one on the Scan page, or add by barcode above.</p>
        )}
        {filteredList.map((p) => (
          <label key={p._id} className="flex items-center gap-2 rounded-md border border-[var(--line)] px-3 py-2 text-sm">
            <input type="checkbox" checked={selected.includes(p._id)} onChange={() => toggle(p._id)} />
            {p.productName}
          </label>
        ))}
      </div>

      {chosen.length >= 2 && (
        <>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-6 rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm"
          >
            {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>

          <div className="mt-4 overflow-x-auto rounded-md border border-[var(--line)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--bg-elevated)] text-left text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Score</th>
                  {METRICS.map((m) => <th key={m.key} className="px-3 py-2 text-right">{m.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {ranked.map((p, i) => (
                  <motion.tr
                    key={p._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                    className="border-b border-[var(--line)] last:border-0"
                  >
                    <td className="px-3 py-2 font-medium">
                      {i === 0 && priority === "overall" && (
                        <span className="mr-1 rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: "var(--good)", color: "white" }}>BEST</span>
                      )}
                      {p.productName}
                    </td>
                    <td className="px-3 py-2"><StarRating rating={p.scoreOutput.starRating} /></td>
                    {METRICS.map((m) => {
                      const val = p.nutritionPer100[m.key];
                      const isBest = val != null && val === bestValueFor(m);
                      return (
                        <td
                          key={m.key}
                          className="px-3 py-2 text-right font-mono"
                          style={isBest ? { color: "var(--good)", fontWeight: 600 } : {}}
                        >
                          {val ?? "—"}{val != null ? m.unit : ""}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {chosen.length === 1 && (
        <p className="mt-4 text-sm text-[var(--ink-dim)]">Select at least one more product to compare.</p>
      )}
    </main>
  );
}