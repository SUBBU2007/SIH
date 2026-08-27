"use client";

import { useState } from "react";
import { recognizeLabel } from "@/lib/ocr/recognize";
import { parseNutrition } from "@/lib/ocr/parser";

export default function ScanInput() {
  const [mode, setMode] = useState("barcode");

  const [barcode, setBarcode] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [product, setProduct] = useState(null);
  const [score, setScore] = useState(null);
  const [ocrValues, setOcrValues] = useState(null);

  // =========================================================
  // RESET RESULT
  // =========================================================

  function resetResult() {
    setStatus("idle");
    setErrorMessage("");
    setProduct(null);
    setScore(null);
    setOcrValues(null);
  }

  // =========================================================
  // CHANGE MODE
  // =========================================================

  function changeMode(newMode) {
    setMode(newMode);

    setBarcode("");
    setImageFile(null);

    resetResult();
  }

  // =========================================================
  // OCR
  // =========================================================

  async function runOcr(file) {
    const data = await recognizeLabel(file);

    return parseNutrition(data);
  }

  // =========================================================
  // SCORE API
  // =========================================================

  async function getScore(payload) {
    const response = await fetch("/api/score", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let message =
        `Score API failed (${response.status})`;

      try {
        const errorData =
          JSON.parse(responseText);

        if (errorData.error) {
          message = errorData.error;
        }
      } catch {
        // Keep default error message.
      }

      throw new Error(message);
    }

    try {
      return JSON.parse(responseText);
    } catch {
      throw new Error(
        "Score API returned an invalid response."
      );
    }
  }

  // =========================================================
  // BARCODE LOOKUP
  // =========================================================

  async function lookupBarcode(code) {
    const response = await fetch(
      `/api/barcode/${encodeURIComponent(code)}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.found) {
      return null;
    }

    return data;
  }

  // =========================================================
  // MODE 1 — BARCODE ONLY
  // =========================================================

  async function handleBarcodeScan() {
    try {
      setStatus("loading");
      setErrorMessage("");
      setProduct(null);
      setScore(null);

      const code = barcode.trim();

      if (!code) {
        throw new Error(
          "Please enter a barcode."
        );
      }

      const lookup =
        await lookupBarcode(code);

      if (!lookup) {
        throw new Error(
          "Product not found for this barcode."
        );
      }

      const payload = {
        productName:
          lookup.productName,

        category: "solid",

        source: {
          barcodeUsed: true,
          ocrUsed: false,
        },

        nutritionPer100:
          lookup.nutritionPer100,

        reconciliation: {
          hasBothSources: false,
        },
      };

      const scored =
        await getScore(payload);

      setProduct(lookup);
      setScore(scored);

      setStatus("done");
    } catch (error) {
      setStatus("error");

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to scan barcode."
      );
    }
  }

  // =========================================================
  // MODE 2 — OCR ONLY
  // =========================================================

  async function handleOcrScan() {
    try {
      setStatus("loading");
      setErrorMessage("");
      setProduct(null);
      setScore(null);
      setOcrValues(null);

      if (!imageFile) {
        throw new Error(
          "Please select a nutrition label image."
        );
      }

      const ocr =
        await runOcr(imageFile);

      setOcrValues(ocr);

      const payload = {
        productName:
          "Scanned label",

        category: "solid",

        source: {
          barcodeUsed: false,
          ocrUsed: true,
        },

        nutritionPer100: ocr,

        reconciliation: {
          hasBothSources: false,
        },
      };

      const scored =
        await getScore(payload);

      setProduct({
        productName:
          "Scanned label",
      });

      setScore(scored);

      setStatus("done");
    } catch (error) {
      setStatus("error");

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to analyze label."
      );
    }
  }

  // =========================================================
  // MODE 3 — BARCODE + OCR VERIFICATION
  // =========================================================

  async function handleVerification() {
    try {
      setStatus("loading");
      setErrorMessage("");
      setProduct(null);
      setScore(null);
      setOcrValues(null);

      const code = barcode.trim();

      if (!code) {
        throw new Error(
          "Please enter a barcode."
        );
      }

      if (!imageFile) {
        throw new Error(
          "Please select the nutrition label image."
        );
      }

      // -----------------------------------------------------
      // DATABASE
      // -----------------------------------------------------

      const lookup =
        await lookupBarcode(code);

      if (!lookup) {
        throw new Error(
          "Product not found for this barcode."
        );
      }

      // -----------------------------------------------------
      // OCR
      // -----------------------------------------------------

      const ocr =
        await runOcr(imageFile);

      setOcrValues(ocr);

      // -----------------------------------------------------
      // IMPORTANT:
      //
      // We use the database nutrition for the main score.
      // OCR is used as independent verification evidence.
      //
      // The score route receives BOTH sources so the
      // mismatch checker can compare them.
      // -----------------------------------------------------

      const payload = {
        productName:
          lookup.productName,

        category: "solid",

        source: {
          barcodeUsed: true,
          ocrUsed: true,
        },

        nutritionPer100:
          lookup.nutritionPer100,

        reconciliation: {
          hasBothSources: true,

          barcodeValues:
            lookup.nutritionPer100,

          ocrValues: ocr,
        },
      };

      const scored =
        await getScore(payload);

      setProduct(lookup);
      setScore(scored);

      setStatus("done");
    } catch (error) {
      setStatus("error");

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to verify product."
      );
    }
  }

  // =========================================================
  // MAIN BUTTON
  // =========================================================

  function handleSubmit() {
    if (mode === "barcode") {
      return handleBarcodeScan();
    }

    if (mode === "ocr") {
      return handleOcrScan();
    }

    if (mode === "verify") {
      return handleVerification();
    }
  }

  // =========================================================
  // STAR DISPLAY
  // =========================================================

  function renderStars(stars) {
    if (
      stars === null ||
      stars === undefined
    ) {
      return null;
    }

    const fullStars =
      Math.floor(stars);

    const hasHalfStar =
      stars % 1 === 0.5;

    const emptyStars =
      5 -
      fullStars -
      (hasHalfStar ? 1 : 0);

    return (
      <div
        className="flex items-center gap-1"
        aria-label={`${stars} out of 5 stars`}
      >
        {Array.from({
          length: fullStars,
        }).map((_, index) => (
          <span
            key={`full-${index}`}
            className="text-4xl leading-none text-[var(--accent)]"
          >
            ★
          </span>
        ))}

        {hasHalfStar && (
          <span className="text-4xl leading-none text-[var(--accent)]">
            ½
          </span>
        )}

        {Array.from({
          length: emptyStars,
        }).map((_, index) => (
          <span
            key={`empty-${index}`}
            className="text-4xl leading-none text-[var(--text-dim)]"
          >
            ☆
          </span>
        ))}
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-6">

      {/* ===================================================
          MODE SELECTOR
          =================================================== */}

      <div className="grid gap-3 md:grid-cols-3">

        <button
          type="button"
          onClick={() =>
            changeMode("barcode")
          }
          className={`rounded-xl border p-4 text-left transition ${
            mode === "barcode"
              ? "border-[var(--accent)] bg-[var(--accent)]/10"
              : "border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]/50"
          }`}
        >
          <div className="text-lg">
            🔎
          </div>

          <p className="mt-2 font-medium">
            Barcode Scan
          </p>

          <p className="mt-1 text-xs text-[var(--text-dim)]">
            Get product information from the database.
          </p>
        </button>


        <button
          type="button"
          onClick={() =>
            changeMode("ocr")
          }
          className={`rounded-xl border p-4 text-left transition ${
            mode === "ocr"
              ? "border-[var(--accent)] bg-[var(--accent)]/10"
              : "border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]/50"
          }`}
        >
          <div className="text-lg">
            📷
          </div>

          <p className="mt-2 font-medium">
            OCR Label Scan
          </p>

          <p className="mt-1 text-xs text-[var(--text-dim)]">
            Analyze nutrition information from a label photo.
          </p>
        </button>


        <button
          type="button"
          onClick={() =>
            changeMode("verify")
          }
          className={`rounded-xl border p-4 text-left transition ${
            mode === "verify"
              ? "border-[var(--accent)] bg-[var(--accent)]/10"
              : "border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]/50"
          }`}
        >
          <div className="text-lg">
            ✓
          </div>

          <p className="mt-2 font-medium">
            Verify Product
          </p>

          <p className="mt-1 text-xs text-[var(--text-dim)]">
            Compare database information with the label.
          </p>
        </button>

      </div>


      {/* ===================================================
          INPUT AREA
          =================================================== */}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">

        {/* BARCODE INPUT */}

        {(mode === "barcode" ||
          mode === "verify") && (
          <div>

            <label className="text-sm text-[var(--text-dim)]">
              Barcode number
            </label>

            <input
              value={barcode}
              onChange={(e) =>
                setBarcode(
                  e.target.value
                )
              }
              placeholder="8901234567890"
              inputMode="numeric"
              className="mt-2 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />

          </div>
        )}


        {/* IMAGE INPUT */}

        {(mode === "ocr" ||
          mode === "verify") && (
          <div
            className={
              mode === "verify"
                ? "mt-4"
                : ""
            }
          >

            <label className="text-sm text-[var(--text-dim)]">
              Nutrition label image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setImageFile(
                  e.target.files?.[0] ||
                    null
                );
              }}
              className="mt-2 w-full text-sm"
            />

          </div>
        )}


        {/* ACTION */}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            status === "loading"
          }
          className="mt-5 rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[#0d1117] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading"
            ? "Processing..."
            : mode === "barcode"
              ? "Get Product Information"
              : mode === "ocr"
                ? "Analyze Label"
                : "Verify & Analyze"}
        </button>

      </div>


      {/* ===================================================
          ERROR
          =================================================== */}

      {status === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {errorMessage ||
            "Something went wrong."}
        </div>
      )}


      {/* ===================================================
          OCR DATA
          =================================================== */}

      {ocrValues && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">

          <p className="text-sm font-medium">
            Extracted nutrition data
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-3">

            <NutritionValue
              label="Energy"
              value={
                ocrValues.energy_kcal
              }
              unit="kcal"
            />

            <NutritionValue
              label="Sugar"
              value={
                ocrValues.sugar_g
              }
              unit="g"
            />

            <NutritionValue
              label="Sodium"
              value={
                ocrValues.sodium_mg
              }
              unit="mg"
            />

            <NutritionValue
              label="Saturated Fat"
              value={
                ocrValues.sat_fat_g
              }
              unit="g"
            />

            <NutritionValue
              label="Protein"
              value={
                ocrValues.protein_g
              }
              unit="g"
            />

            <NutritionValue
              label="Fibre"
              value={
                ocrValues.fiber_g
              }
              unit="g"
            />

          </div>

        </div>
      )}


      {/* ===================================================
          PRODUCT RESULT
          =================================================== */}

      {product && score && (
        <div className="space-y-5">

          {/* PRODUCT */}

          <div>
            <p className="text-lg font-semibold">
              {product.productName}
            </p>

            {mode === "barcode" && (
              <p className="mt-1 text-xs text-[var(--text-dim)]">
                Source: Open Food Facts
              </p>
            )}

            {mode === "ocr" && (
              <p className="mt-1 text-xs text-[var(--text-dim)]">
                Source: Nutrition label OCR
              </p>
            )}

            {mode === "verify" && (
              <p className="mt-1 text-xs text-[var(--text-dim)]">
                Sources: Database + Label OCR
              </p>
            )}
          </div>


          {/* =================================================
              STAR RATING
              ================================================= */}

          {score.scoreStatus ===
            "CALCULATED" && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6">

              <p className="text-sm text-[var(--text-dim)]">
                LabelSense Nutrition Rating
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-5">

                {renderStars(
                  score.starRating
                )}

                <div>

                  <p className="text-2xl font-semibold">
                    {score.starRating} / 5
                  </p>

                  <p className="text-xs text-[var(--text-dim)]">
                    INR-aligned nutritional profile
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* =================================================
              FOODSCORE
              ================================================= */}

          {score.scoreStatus ===
            "CALCULATED" && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">

              <div className="flex items-center justify-between">

                <span className="text-sm text-[var(--text-dim)]">
                  FoodScore
                </span>

                <span className="text-2xl font-semibold">
                  {score.foodScore}
                </span>

              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">

                <div className="rounded-lg bg-black/20 p-3">

                  <p className="text-xs text-[var(--text-dim)]">
                    Baseline points
                  </p>

                  <p className="mt-1 text-lg font-medium">
                    {score.baselinePoints}
                  </p>

                </div>

                <div className="rounded-lg bg-black/20 p-3">

                  <p className="text-xs text-[var(--text-dim)]">
                    Positive points
                  </p>

                  <p className="mt-1 text-lg font-medium">
                    −{score.positivePoints}
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* =================================================
              NUTRIENT POINTS
              ================================================= */}

          {score.scoreStatus ===
            "CALCULATED" &&
            score.nutrientPoints && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">

              <p className="text-sm font-medium">
                Nutrient point breakdown
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">

                <PointRow
                  label="Energy"
                  value={
                    score.nutrientPoints
                      .negative.energy
                  }
                />

                <PointRow
                  label="Sugar"
                  value={
                    score.nutrientPoints
                      .negative.totalSugar
                  }
                />

                <PointRow
                  label="Saturated Fat"
                  value={
                    score.nutrientPoints
                      .negative.saturatedFat
                  }
                />

                <PointRow
                  label="Sodium"
                  value={
                    score.nutrientPoints
                      .negative.sodium
                  }
                />

              </div>

            </div>
          )}


          {/* =================================================
              POSITIVE NUTRIENTS
              ================================================= */}

          {score.scoreStatus ===
            "CALCULATED" &&
            score.nutrientPoints
              ?.cappedPositive && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">

              <p className="text-sm font-medium">
                Positive nutrients
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">

                <PointRow
                  label="Protein"
                  value={
                    -score
                      .nutrientPoints
                      .cappedPositive
                      .protein
                  }
                />

                <PointRow
                  label="Fibre"
                  value={
                    -score
                      .nutrientPoints
                      .cappedPositive
                      .fibre
                  }
                />

              </div>

            </div>
          )}


          {/* =================================================
              HOW IT WAS CALCULATED
              ================================================= */}

          {score.scoreStatus ===
            "CALCULATED" && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 text-sm">

              <p className="font-medium">
                How the rating was calculated
              </p>

              <div className="mt-3 space-y-1 text-[var(--text-dim)]">

                <p>
                  Baseline points = maximum
                  negative nutrient points.
                </p>

                <p>
                  FoodScore ={" "}
                  <span className="text-white">
                    {score.baselinePoints}
                  </span>{" "}
                  −{" "}
                  <span className="text-white">
                    {score.positivePoints}
                  </span>{" "}
                  ={" "}
                  <span className="font-semibold text-white">
                    {score.foodScore}
                  </span>
                </p>

                <p className="pt-2 text-xs">
                  The rating is calculated
                  deterministically from the
                  normalized nutrition values.
                </p>

              </div>

            </div>
          )}


          {/* =================================================
              VERIFICATION RESULT
              ================================================= */}

          {mode === "verify" && (
            <div
              className={`rounded-xl border p-5 ${
                score.mismatchCheck
                  ?.hasMismatch
                  ? "border-yellow-500/40 bg-yellow-500/10"
                  : "border-green-500/30 bg-green-500/10"
              }`}
            >

              <p className="font-medium">
                {score.mismatchCheck
                  ?.hasMismatch
                  ? "⚠ Verification mismatch detected"
                  : "✓ Database and label data match"}
              </p>

              {score.mismatchCheck
                ?.hasMismatch && (
                <div className="mt-3 text-sm">

                  <p className="text-[var(--text-dim)]">
                    Fields with significant
                    differences:
                  </p>

                  <ul className="mt-2 list-inside list-disc">

                    {score.mismatchCheck.fields.map(
                      (field) => (
                        <li
                          key={field.field}
                        >
                          {field.field}:{" "}
                          {field.differencePercent}%
                          difference
                        </li>
                      )
                    )}

                  </ul>

                </div>
              )}

            </div>
          )}


          {/* =================================================
              SCORE UNAVAILABLE
              ================================================= */}

          {score.scoreStatus ===
            "NOT_AVAILABLE" && (
            <div className="rounded-xl border border-yellow-600/40 bg-yellow-600/10 px-4 py-4 text-sm text-yellow-300">

              <p className="font-medium">
                FoodScore unavailable
              </p>

              <p className="mt-1">
                Required nutrition information
                could not be reliably verified.
              </p>

              {score.reason && (
                <p className="mt-1 text-xs">
                  Reason: {score.reason}
                </p>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}


// ===========================================================
// SMALL UI COMPONENTS
// ===========================================================

function NutritionValue({
  label,
  value,
  unit,
}) {
  const available =
    value !== null &&
    value !== undefined;

  return (
    <div className="rounded-lg bg-black/20 p-3">

      <p className="text-xs text-[var(--text-dim)]">
        {label}
      </p>

      <p className="mt-1 font-medium">
        {available
          ? `${value} ${unit}`
          : "Not available"}
      </p>

    </div>
  );
}


function PointRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-3">

      <span className="text-[var(--text-dim)]">
        {label}
      </span>

      <span className="font-medium">
        {value > 0
          ? `+${value}`
          : value}
      </span>

    </div>
  );
}