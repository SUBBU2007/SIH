"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Barcode, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

const steps = [
  { icon: Barcode, title: "Scan or upload", text: "Enter a barcode, upload a label photo, or both." },
  { icon: ShieldCheck, title: "Cross-check", text: "Barcode and label data are compared — mismatches get flagged, not hidden." },
  { icon: Sparkles, title: "See the reasoning", text: "A transparent score with the exact numbers and logic behind it." },
];

const features = [
  { title: "Dual-source verification", text: "Barcode lookup and OCR label scanning cross-check each other, not just one source you have to trust blindly." },
  { title: "Transparent scoring", text: "No mystery grade. Every score comes with the per-nutrient breakdown and the reasoning behind it." },
  { title: "Mismatch detection", text: "When the database and the physical label disagree, you see it — and how much they disagree by." },
  { title: "Built on real thresholds", text: "Scoring is grounded in stated, documented nutrition reference values — not an opaque black box." },
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-6 pt-24 pb-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-display text-4xl font-medium tracking-tight text-[var(--ink)] sm:text-5xl"
        >
          Know what's actually in it.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-4 text-lg text-[var(--ink-dim)]"
        >
          Scan a barcode or a label photo. Get a transparent, explainable nutrition score — not a mystery grade.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Link
            href="/scan"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            Start scanning <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] p-5"
            >
              <Icon size={20} className="text-[var(--accent)]" />
              <p className="font-display mt-3 font-medium">{title}</p>
              <p className="mt-1 text-sm text-[var(--ink-dim)]">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="font-display text-xl font-medium">Why it's different</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {features.map(({ title, text }) => (
            <div key={title} className="rounded-lg border border-[var(--line)] p-5">
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-[var(--ink-dim)]">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}