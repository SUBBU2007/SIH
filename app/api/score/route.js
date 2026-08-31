import { NextResponse } from "next/server";
import { computeScore, checkMismatch } from "@/lib/ruleEngine";
import { connectDB } from "@/lib/mongodb";
import Product from "@/lib/models/Product";

export async function POST(req) {
  try {
    const body = await req.json();
    const { barcode, productName, nutritionPer100, category = "snacks", reconciliation, source, quality } = body;

    if (category !== "snacks") {
      return NextResponse.json({
        status: "not_available",
        scoreStatus: "NOT_AVAILABLE",
        reason: "UNKNOWN_OR_UNSUPPORTED_CATEGORY",
        foodScore: null, starRating: null, starDisplay: null,
      });
    }

    const round1 = (v) => (typeof v === "number" ? Math.round(v * 10) / 10 : v);
    const cleanNutrition = Object.fromEntries(
      Object.entries(nutritionPer100 || {}).map(([k, v]) => [k, round1(v)])
    );

    const scored = computeScore(cleanNutrition);

    const mismatch = reconciliation?.hasBothSources
      ? checkMismatch(reconciliation.barcodeValues, reconciliation.ocrValues)
      : { hasMismatch: false, severity: "none", fields: [] };

    const warnings = [];
    if (mismatch.hasMismatch) {
      warnings.push(`Data mismatch detected: ${mismatch.fields.map((f) => f.field).join(", ")}`);
    }
    if (scored.scoreStatus === "NOT_AVAILABLE") {
      warnings.push("A definitive FoodScore could not be calculated from the available nutrition data.");
    }

    const output = {
      status: scored.scoreStatus === "CALCULATED" ? "computed" : "not_available",
      category,
      source,
      quality,
      ...scored,
      nutritionPer100: cleanNutrition,
      mismatchCheck: mismatch,
      warnings,
    };

    // try {
    //   await connectDB();
    //   if (barcode) {
    //     await Product.findOneAndUpdate(
    //       { barcode },
    //       { barcode, productName, category, source, nutritionPer100: cleanNutrition, reconciliation, scoreOutput: output },
    //       { upsert: true, new: true }
    //     );
    //   } else {
    //     await Product.create({ productName, category, source, nutritionPer100: cleanNutrition, reconciliation, scoreOutput: output });
    //   }
    //   console.log("Saved to DB:", productName);
    // } catch (err) {
    //   console.error("DB save failed:", err.message);
    // }

    try {
      await connectDB();
      if (barcode) {
        await Product.findOneAndUpdate(
          { barcode },
          {
            barcode,
            productName,
            category,
            source,
            quality,
            nutritionPer100: cleanNutrition,
            reconciliation,
            scoreOutput: output,
          },
          { upsert: true, new: true },
        );
      } else if (productName && productName.trim()) {
        const nameKey = productName.trim().toLowerCase();
        await Product.findOneAndUpdate(
          { nameKey },
          {
            nameKey,
            productName: productName.trim(),
            category,
            source,
            quality,
            nutritionPer100: cleanNutrition,
            reconciliation,
            scoreOutput: output,
          },
          { upsert: true, new: true },
        );
      } else {
        await Product.create({
          productName,
          category,
          source,
          nutritionPer100: cleanNutrition,
          reconciliation,
          scoreOutput: output,
        });
      }
      console.log("Saved to DB:", productName);
    } catch (err) {
      console.error("DB save failed:", err.message);
    }

    return NextResponse.json(output);
  } catch (error) {
    console.error("Score API error:", error);
    return NextResponse.json(
      { status: "error", scoreStatus: "INVALID_INPUT", reason: "INVALID_REQUEST", error: "Unable to calculate FoodScore." },
      { status: 400 }
    );
  }
}