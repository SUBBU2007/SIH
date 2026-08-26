import { NextResponse } from "next/server";
import { computeScore, checkMismatch } from "@/lib/ruleEngine";

// Accepts the locked input contract, returns the locked output contract.
export async function POST(req) {
  const body = await req.json();

  const {
    nutritionPer100,
    reconciliation,
  } = body;

  const scored = computeScore(nutritionPer100);

  const mismatch = reconciliation?.hasBothSources
    ? checkMismatch(
        reconciliation.barcodeValues,
        reconciliation.ocrValues
      )
    : {
        hasMismatch: false,
        severity: "none",
        fields: [],
      };

  return NextResponse.json({
    status: "computed",
    ...scored,
    mismatchCheck: mismatch,
    warnings: mismatch.hasMismatch
      ? [
          `Data mismatch detected: ${mismatch.fields
            .map((field) => field.field)
            .join(", ")}`,
        ]
      : [],
  });
}