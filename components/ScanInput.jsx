"use client";

import { useState } from "react";
import { recognizeLabel } from "@/lib/ocr/recognize";
import { parseNutrition } from "@/lib/ocr/parser";

export default function ScanInput() {
  const [barcode, setBarcode] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [product, setProduct] = useState(null);
  const [score, setScore] = useState(null);
  const [ocrValues, setOcrValues] = useState(null);

  async function runOcr(file) {
    const data = await recognizeLabel(file);
    return parseNutrition(data);
  }

  async function handleSubmit() {
    try {
      setStatus("loading");
      setErrorMessage("");
      setScore(null);
      setProduct(null);
      setOcrValues(null);

      // ---------------------------------------------
      // BARCODE LOOKUP
      // ---------------------------------------------

      let lookup = null;

      if (barcode.trim()) {
        const lookupRes = await fetch(
          `/api/barcode/${encodeURIComponent(barcode.trim())}`
        );

        if (lookupRes.ok) {
          const data = await lookupRes.json();

          if (data.found) {
            lookup = data;
          }
        }
      }

      // ---------------------------------------------
      // OCR
      // ---------------------------------------------

      let ocr = null;

      if (imageFile) {
        ocr = await runOcr(imageFile);
        setOcrValues(ocr);
      }

      // ---------------------------------------------
      // CHECK INPUT
      // ---------------------------------------------

      if (!lookup && !ocr) {
        setStatus("error");
        setErrorMessage(
          "Nothing found. Check the barcode or photo."
        );
        return;
      }

      // ---------------------------------------------
      // NUTRITION DATA
      // ---------------------------------------------

      const nutritionPer100 = lookup
        ? lookup.nutritionPer100
        : ocr;

      const productName = lookup
        ? lookup.productName
        : "Scanned label (no barcode)";

      setProduct(
        lookup || {
          productName,
        }
      );

      // ---------------------------------------------
      // RECONCILIATION
      // ---------------------------------------------

      const hasBothSources = Boolean(lookup && ocr);

      const reconciliation = hasBothSources
        ? {
            hasBothSources: true,
            barcodeValues: lookup.nutritionPer100,
            ocrValues: ocr,
          }
        : {
            hasBothSources: false,
          };

      // ---------------------------------------------
      // SCORE API PAYLOAD
      // ---------------------------------------------

      const payload = {
        productName,
        category: "unknown",

        source: {
          barcodeUsed: Boolean(lookup),
          ocrUsed: Boolean(ocr),
        },

        nutritionPer100,

        reconciliation,
      };

      // ---------------------------------------------
      // SCORE API
      // ---------------------------------------------

      const scoreRes = await fetch("/api/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await scoreRes.text();

      if (!scoreRes.ok) {
        let message = `Score API failed (${scoreRes.status})`;

        try {
          const errorData = JSON.parse(responseText);

          if (errorData.error) {
            message = errorData.error;
          }
        } catch {
          // Keep the default error message.
        }

        throw new Error(message);
      }

      let scored;

      try {
        scored = JSON.parse(responseText);
      } catch {
        throw new Error(
          "Score API returned an invalid response."
        );
      }

      setScore(scored);
      setStatus("done");
    } catch (error) {
      console.error("Scan failed:", error);

      setStatus("error");

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while scanning."
      );
    }
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-6">

      {/* BARCODE */}

      <label className="text-sm text-[var(--text-dim)]">
        Barcode number (optional)
      </label>

      <input
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        placeholder="8901234567890"
        className="mt-2 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
      />

      {/* IMAGE */}

      <label className="mt-4 block text-sm text-[var(--text-dim)]">
        Label photo (optional)
      </label>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          setImageFile(e.target.files?.[0] || null);
        }}
        className="mt-2 w-full text-sm"
      />

      {/* SCAN BUTTON */}

      <button
        onClick={handleSubmit}
        disabled={status === "loading"}
        className="mt-4 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#0d1117] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? "Scanning..." : "Scan"}
      </button>

      {/* STATUS */}

      {status === "loading" && (
        <p className="mt-4 text-sm text-[var(--text-dim)]">
          Reading label...
        </p>
      )}

      {status === "error" && (
        <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {errorMessage || "Something went wrong."}
        </div>
      )}

      {/* OCR VALUES */}

      {ocrValues && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">
            OCR extracted values
          </p>

          <pre className="overflow-x-auto rounded-md bg-black/20 p-3 text-xs whitespace-pre-wrap">
            {JSON.stringify(ocrValues, null, 2)}
          </pre>
        </div>
      )}

      {/* SCORE */}

      {product && score && (
        <div className="mt-6 space-y-4">

          <div>
            <p className="text-lg font-medium">
              {product.productName}
            </p>

            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-semibold text-[var(--accent)]">
                {score.overallScore}
              </span>

              <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs">
                {score.grade}
              </span>
            </div>
          </div>

          {/* METRIC SCORES */}

          {score.metricScores && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(score.metricScores).map(
                ([key, val]) => (
                  <div
                    key={key}
                    className="rounded-md bg-black/20 px-3 py-2"
                  >
                    <span className="text-[var(--text-dim)]">
                      {key}
                    </span>

                    <span className="float-right">
                      {Math.round(val)}
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          {/* MISMATCH */}

          {score.mismatchCheck?.hasMismatch && (
            <div className="rounded-md border border-yellow-600/40 bg-yellow-600/10 px-3 py-2 text-xs text-yellow-300">
              Mismatch (
              {score.mismatchCheck.severity}
              ):{" "}
              {score.mismatchCheck.fields
                .map((field) => field.field)
                .join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}