import { NextResponse } from "next/server";
import {
  computeScore,
  checkMismatch,
} from "@/lib/ruleEngine";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      nutritionPer100,
      category = "solid",
      reconciliation,
    } = body;

    // --------------------------------------------------------
    // CATEGORY
    // --------------------------------------------------------

    /*
     * Current MVP is focused on packaged solid foods/snacks.
     *
     * Beverage rules are intentionally not mixed with
     * solid-food rules.
     */

    if (
      category !== "solid" &&
      category !== "snacks"
    ) {
      return NextResponse.json(
        {
          status: "not_available",
          scoreStatus: "NOT_AVAILABLE",
          reason: "UNKNOWN_OR_UNSUPPORTED_CATEGORY",
          foodScore: null,
          starRating: null,
          starDisplay: null,
        },
        { status: 200 }
      );
    }

    // --------------------------------------------------------
    // FOOD SCORE
    // --------------------------------------------------------

    const scored =
      computeScore(nutritionPer100);

    // --------------------------------------------------------
    // OCR / DATABASE MISMATCH
    // --------------------------------------------------------

    const mismatch =
      reconciliation?.hasBothSources
        ? checkMismatch(
            reconciliation.barcodeValues,
            reconciliation.ocrValues
          )
        : {
            hasMismatch: false,
            severity: "none",
            fields: [],
          };

    // --------------------------------------------------------
    // WARNINGS
    // --------------------------------------------------------

    const warnings = [];

    if (mismatch.hasMismatch) {
      warnings.push(
        `Data mismatch detected: ${mismatch.fields
          .map((field) => field.field)
          .join(", ")}`
      );
    }

    if (
      scored.scoreStatus === "NOT_AVAILABLE"
    ) {
      warnings.push(
        "A definitive FoodScore could not be calculated from the available nutrition data."
      );
    }

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return NextResponse.json({
      status:
        scored.scoreStatus === "CALCULATED"
          ? "computed"
          : "not_available",

      category,

      ...scored,

      mismatchCheck: mismatch,

      warnings,
    });
  } catch (error) {
    console.error("Score API error:", error);

    return NextResponse.json(
      {
        status: "error",
        scoreStatus: "INVALID_INPUT",
        reason: "INVALID_REQUEST",
        error: "Unable to calculate FoodScore.",
      },
      { status: 400 }
    );
  }
}