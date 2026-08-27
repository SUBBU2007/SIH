"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CATEGORIES = ["snacks", "beverages", "dairy", "instant_food", "cereals"];
const PRIORITIES = {
  overall: { label: "Overall score", key: "overallScore", better: "high" },
  sugar: { label: "Lowest sugar", key: "sugar_g", better: "low" },
  sodium: { label: "Lowest sodium", key: "sodium_mg", better: "low" },
  protein: { label: "Highest protein", key: "protein_g", better: "high" },
};

export default function ComparePage() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("snacks");
  const [priority, setPriority] = useState("overall");

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  const inCategory = products.filter((p) => p.category === category);

  const ranked = [...inCategory].sort((a, b) => {
    const { key, better } = PRIORITIES[priority];
    const va = key === "overallScore" ? a.scoreOutput.overallScore : a.nutritionPer100[key];
    const vb = key === "overallScore" ? b.scoreOutput.overallScore : b.nutritionPer100[key];
    return better === "low" ? va - vb : vb - va;
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl font-medium tracking-tight">Compare products</h1>
      <p className="mt-2 text-[var(--ink-dim)]">
        Ranking only happens within the same category — comparing a biscuit to a juice by sugar isn't meaningful.
      </p>

      <div className="mt-6 flex gap-4">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm">
          {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {ranked.length === 0 && (
        <p className="mt-8 text-sm text-[var(--ink-dim)]">No scanned products in this category yet.</p>
      )}

      <div className="mt-6 space-y-3">
        {ranked.map((p, i) => (
          <motion.div
            key={p._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="flex items-center justify-between rounded-md border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-[var(--ink-dim)]">#{i + 1}</span>
              <span className="font-medium">{p.productName}</span>
            </div>
            <span className="font-mono text-sm">
              {priority === "overall" ? `${p.scoreOutput.overallScore} / 100` : `${p.nutritionPer100[PRIORITIES[priority].key]} ${priority === "sodium" ? "mg" : "g"}`}
            </span>
          </motion.div>
        ))}
      </div>
    </main>
  );
}