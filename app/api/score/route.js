import { NextResponse } from "next/server";
import {
  computeScore,
  checkMismatch,
  generateExplanation,
  buildSummary,
} from "@/lib/ruleEngine";
import { connectDB } from "@/lib/mongodb";
import Product from "@/lib/models/Product";

export async function POST(req) {
  const body = await req.json();
  const { barcode, productName, category, nutritionPer100, reconciliation, source } = body;

  const scored = computeScore(nutritionPer100);

  const mismatch = reconciliation?.hasBothSources
    ? checkMismatch(reconciliation.barcodeValues, reconciliation.ocrValues)
    : { hasMismatch: false, severity: "none", fields: [] };

  const whyThisResult = generateExplanation(scored.metricScores);
  const defaultSummary = buildSummary(scored.grade, scored.metricScores);

  const output = {
    status: "computed",
    ...scored,
    nutritionPer100,
    recommendations: { defaultSummary, goalMode: "overall", rank: null },
    explainability: {
      rulesApplied: ["overall_weighted_score_v1", "mismatch_threshold_v1"],
      whyThisResult,
    },
    mismatchCheck: mismatch,
    warnings: mismatch.hasMismatch
      ? [`Data mismatch detected: ${mismatch.fields.map((f) => f.field).join(", ")}`]
      : [],
  };

  try {
    await connectDB();
    if (barcode) {
      await Product.findOneAndUpdate(
        { barcode },
        {
          barcode,
          productName,
          category: category || "unknown",
          source,
          nutritionPer100,
          reconciliation,
          scoreOutput: output,
        },
        { upsert: true, new: true },
      );
    } else {
      // OCR-only scans have no stable identifier yet — still created fresh.
      // Revisit once products have a persistent ID beyond barcode.
      await Product.create({
        productName,
        category: category || "unknown",
        source,
        nutritionPer100,
        reconciliation,
        scoreOutput: output,
      });
    }
    console.log("Saved to DB:", productName);
  } catch (err) {
    console.error("DB save failed:", err.message);
  }

  return NextResponse.json(output);
}