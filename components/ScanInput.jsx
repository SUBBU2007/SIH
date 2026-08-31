// "use client";

// import { useState } from "react";
// import { motion } from "framer-motion";
// import { recognizeLabel } from "@/lib/ocr/recognize";
// import { parseNutrition } from "@/lib/ocr/parser";

// import StarRating from "@/components/StarRating";
// import InfoTooltip from "@/components/InfoTooltip";

// export default function ScanInput() {
//   const [barcode, setBarcode] = useState("");
//   const [imageFile, setImageFile] = useState(null);
//   const [category, setCategory] = useState("snacks");
//   const [status, setStatus] = useState("idle");
//   const [errorMessage, setErrorMessage] = useState("");
//   const [product, setProduct] = useState(null);
//   const [score, setScore] = useState(null);
//   const [aiSummary, setAiSummary] = useState(null);
//   const [manualName, setManualName] = useState("");

//   const NUTRIENT_INFO = {
//     Energy:
//       "Total calories from the food. General population reference: ~2000 kcal/day (varies by individual).",
//     Sugar:
//       "Free sugars are linked to excess calorie intake. WHO general guidance: keep under ~10% of total daily energy from sugar.",
//     Sodium:
//       "Excess sodium is linked to raised blood pressure over time. WHO general guidance: under 2000mg/day.",
//     Protein:
//       "Supports muscle and tissue repair. Generally a 'more is favorable' nutrient in scoring, within reason.",
//     "Saturated fat":
//       "Linked to raised LDL cholesterol with regular high intake. General guidance: keep under ~10% of total daily energy.",
//     Fibre:
//       "Supports digestion; generally under-consumed in typical diets. Higher is favorable.",
//   };
  
//   //plain OCR - tesseract
//   // async function runOcr(file) {
//   //   const data = await recognizeLabel(file);
//   //   return parseNutrition(data);
//   // }

//   //Gemini - vision
//   // async function runOcr(file) {
//   //   const formData = new FormData();
//   //   formData.append("image", file);
//   //   const res = await fetch("/api/ocr-vision", {
//   //     method: "POST",
//   //     body: formData,
//   //   });
//   //   return await res.json();
//   // }

//   //both combined
//   async function runOcr(file) {
//     try {
//       const formData = new FormData();
//       formData.append("image", file);
//       const res = await fetch("/api/ocr-vision", {
//         method: "POST",
//         body: formData,
//       });
//       if (!res.ok) throw new Error("Vision OCR failed");
//       const result = await res.json();
//       if (result.error) throw new Error(result.error);
//       return {
//         nutrition: result,
//         meta: { ocrEngine: "gemini-vision", ocrConfidence: null },
//       };
//     } catch (err) {
//       console.warn(
//         "Vision OCR unavailable, falling back to Tesseract:",
//         err.message,
//       );
//       const data = await recognizeLabel(file);
//       const nutrition = parseNutrition(data);
//       return {
//         nutrition,
//         meta: {
//           ocrEngine: "tesseract",
//           ocrConfidence: data.confidence ?? null,
//         },
//       };
//     }
//   }

//   async function handleSubmit() {
//     try {
//       setStatus("loading");
//       setErrorMessage("");
//       setScore(null);
//       setProduct(null);
//       setAiSummary(null);

//       let lookup = null;
//       if (barcode.trim()) {
//         const lookupRes = await fetch(`/api/barcode/${encodeURIComponent(barcode.trim())}`);
//         if (lookupRes.ok) {
//           const data = await lookupRes.json();
//           if (data.found) lookup = data;
//         }
//       }

//       // let ocr = null;
//       // if (imageFile) {
//       //   ocr = await runOcr(imageFile);
//       // }
//       let ocr = null;
//       let ocrMeta = null;
//       if (imageFile) {
//         const ocrResult = await runOcr(imageFile);
//         ocr = ocrResult.nutrition;
//         ocrMeta = ocrResult.meta;
//       }

//       if (!lookup && !ocr) {
//         setStatus("error");
//         setErrorMessage("Nothing found, check the barcode or photo.");
//         return;
//       }

//       if (!lookup && ocr && !manualName.trim()) {
//         setStatus("error");
//         setErrorMessage("Please enter a product name for label only scans.");
//         return;
//       }

//       const productName = lookup ? lookup.productName : (manualName.trim() || "Scanned label (no barcode)");
//       setProduct({ productName });

//       const hasBothSources = Boolean(lookup && ocr);
//       const nutritionPer100 = lookup ? lookup.nutritionPer100 : ocr;

//       const scoreRes = await fetch("/api/score", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           barcode: barcode || null,
//           productName,
//           category,
//           source: { barcodeUsed: Boolean(lookup), ocrUsed: Boolean(ocr) },
//           quality: ocrMeta,
//           nutritionPer100,
//           reconciliation: hasBothSources
//             ? { hasBothSources: true, barcodeValues: lookup.nutritionPer100, ocrValues: ocr }
//             : { hasBothSources: false },
//         }),
//       });
//       if (!scoreRes.ok) throw new Error(`Score API failed (${scoreRes.status})`);
//       const scored = await scoreRes.json();
//       setScore(scored);

//       if (scored.scoreStatus === "CALCULATED") {
//         const explainRes = await fetch("/api/explain", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             productName,
//             overallScore: scored.foodScore,
//             grade: scored.starDisplay,
//             nutritionPer100,
//             whyThisResult: [`Strongest concern: ${scored.explanationData?.strongestNegativeFactor?.factor ?? "none"}`],
//           }),
//         });
//         const explained = await explainRes.json();
//         setAiSummary(explained.aiSummary);
//       }

//       setStatus("done");
//     } catch (error) {
//       console.error("Scan failed:", error);
//       setStatus("error");
//       setErrorMessage(error instanceof Error ? error.message : "Something went wrong while scanning.");
//     }
//   }

//   return (
//     <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] p-6">
//       <label className="text-sm text-[var(--ink-dim)]">
//         Barcode number (optional)
//       </label>
//       <input
//         value={barcode}
//         onChange={(e) => setBarcode(e.target.value)}
//         placeholder="8901234567890"
//         className="font-mono mt-2 w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
//       />

//       <label className="mt-4 block text-sm text-[var(--ink-dim)]">
//         Product name (required if no barcode)
//       </label>
//       <input
//         value={manualName}
//         onChange={(e) => setManualName(e.target.value)}
//         placeholder="e.g. GoodDay Choco Chip"
//         className="mt-2 w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
//       />

//       <label className="mt-4 block text-sm text-[var(--ink-dim)]">
//         Category
//       </label>
//       <select
//         value={category}
//         onChange={(e) => setCategory(e.target.value)}
//         className="mt-2 w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
//       >
//         <option value="snacks">Snacks</option>
//         <option value="solid">Solid food (other)</option>
//       </select>
//       <p className="mt-1 text-xs text-[var(--ink-dim)]">
//         Only these two categories are scored right now — others return "not
//         available."
//       </p>

//       <label className="mt-4 block text-sm text-[var(--ink-dim)]">
//         Label photo (optional)
//       </label>
//       <input
//         type="file"
//         accept="image/*"
//         onChange={(e) => setImageFile(e.target.files?.[0] || null)}
//         className="mt-2 w-full text-sm"
//       />

//       <button
//         onClick={handleSubmit}
//         disabled={status === "loading"}
//         className="mt-4 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
//       >
//         {status === "loading" ? "Scanning…" : "Scan"}
//       </button>

//       {status === "error" && (
//         <div
//           className="mt-4 rounded-md border border-[var(--alert)]/30 bg-[var(--alert)]/10 px-3 py-2 text-sm"
//           style={{ color: "var(--alert)" }}
//         >
//           {errorMessage}
//         </div>
//       )}

//       {product && score && score.scoreStatus === "CALCULATED" && (
//         <motion.div
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.35 }}
//           className="mt-6 overflow-hidden rounded-md border-2 border-[var(--ink)]"
//         >
//           <div className="border-b-2 border-[var(--ink)] bg-[var(--bg-elevated)] px-4 py-3">
//             <p className="px-4 pb-3 text-xs text-[var(--ink-dim)]">
//               Reference values shown are general population guidance, not
//               personalized dietary advice.
//             </p>
//             <p className="font-display text-base font-medium">
//               {product.productName}
//             </p>
//             <div className="mt-1 flex items-center gap-2">
//               <StarRating rating={score.starRating} />
//               <span className="text-sm text-[var(--ink-dim)]">
//                 FoodScore: {score.foodScore}
//                 <InfoTooltip text="Based on an adaptation of FSSAI's draft Indian Nutrition Rating (INR) framework. Energy, sugar, saturated fat, and sodium each earn penalty points on a threshold scale - only the single worst factor counts toward your score. Protein and fibre earn capped bonus points, subtracted from it. Lower FoodScore means fewer nutritional concerns, shown here as more stars. This is a comparison tool, not medical or diagnostic advice." />
//               </span>
//             </div>
//             {aiSummary && (
//               <p className="mt-1 text-sm italic text-[var(--ink-dim)]">
//                 {aiSummary}
//               </p>
//             )}
//             <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--ink-dim)]">
//               <span className="rounded-full border border-[var(--line)] px-2 py-0.5">
//                 {score.source?.barcodeUsed && score.source?.ocrUsed
//                   ? score.mismatchCheck?.hasMismatch
//                     ? "Barcode + Label (mismatch flagged)"
//                     : "Barcode + Label (verified match)"
//                   : score.source?.barcodeUsed
//                     ? "Source: Open Food Facts"
//                     : score.source?.ocrUsed
//                       ? "Source: Label scan"
//                       : "Source: unknown"}
//               </span>
//               {score.quality?.ocrEngine === "tesseract" &&
//                 score.quality?.ocrConfidence != null && (
//                   <span>
//                     OCR confidence: {Math.round(score.quality.ocrConfidence)}%
//                   </span>
//                 )}
//               {score.quality?.ocrEngine === "gemini-vision" && (
//                 <span>Label read via AI vision</span>
//               )}
//             </div>
//           </div>

//           <div className="divide-y divide-[var(--line)]">
//             <p className="px-4 py-2 text-xs uppercase tracking-wide text-[var(--ink-dim)]">
//               Per 100g
//             </p>
//             {[
//               ["Energy", score.normalizedNutrition.energy_kcal, "kcal"],
//               ["Sugar", score.normalizedNutrition.sugar_g, "g"],
//               ["Sodium", score.normalizedNutrition.sodium_mg, "mg"],
//               ["Protein", score.normalizedNutrition.protein_g, "g"],
//               ["Saturated fat", score.normalizedNutrition.sat_fat_g, "g"],
//               ["Fibre", score.normalizedNutrition.fiber_g, "g"],
//             ].map(([label, value, unit], i) => (
//               <motion.div
//                 key={label}
//                 initial={{ opacity: 0, x: -6 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.25, delay: 0.1 + i * 0.05 }}
//                 className="flex items-center justify-between px-4 py-2 text-sm"
//               >
//                 <span className="text-[var(--ink-dim)] flex items-center">
//                   {label}
//                   <InfoTooltip text={NUTRIENT_INFO[label]} />
//                 </span>
//                 {/* <span className="text-[var(--ink-dim)]">{label}</span> */}
//                 <span className="font-mono">
//                   {value ?? "—"} {value != null ? unit : ""}
//                 </span>
//               </motion.div>
//             ))}
//           </div>

//           <div className="border-t border-[var(--line)] px-4 py-3">
//             <p className="text-xs uppercase tracking-wide text-[var(--ink-dim)]">
//               Why this result
//             </p>
//             <p className="mt-2 text-sm text-[var(--ink-dim)]">
//               Strongest concern:{" "}
//               {score.explanationData?.strongestNegativeFactor?.factor ?? "none"}{" "}
//               ({score.explanationData?.strongestNegativeFactor?.points ?? 0}{" "}
//               points)
//             </p>
//             <p className="mt-1 text-sm text-[var(--ink-dim)]">
//               Positive factors counted:{" "}
//               {score.explanationData?.positiveFactorsUsed?.join(", ") || "none"}
//             </p>
//           </div>

//           {score.mismatchCheck?.hasMismatch && (
//             <div
//               className="border-t border-[var(--line)] px-4 py-3 text-xs"
//               style={{
//                 color: "var(--alert)",
//                 background: "rgba(178,59,59,0.06)",
//               }}
//             >
//               Mismatch ({score.mismatchCheck.severity}):{" "}
//               {score.mismatchCheck.fields.map((f) => f.field).join(", ")}
//             </div>
//           )}
//         </motion.div>
//       )}

//       {score && score.scoreStatus !== "CALCULATED" && (
//         <div className="mt-6 rounded-md border border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-dim)]">
//           Score not available: {score.reason}
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { recognizeLabel } from "@/lib/ocr/recognize";
import { parseNutrition } from "@/lib/ocr/parser";
import StarRating from "@/components/StarRating";
import InfoTooltip from "@/components/InfoTooltip";

const NUTRIENT_INFO = {
  Energy: "Total calories from the food. General reference: ~2000 kcal/day (varies by individual).",
  Sugar: "Free sugars are linked to excess calorie intake. General guidance: keep under ~10% of daily energy from sugar.",
  Sodium: "Excess sodium is linked to raised blood pressure over time. General guidance: under 2000mg/day.",
  Protein: "Supports muscle and tissue repair. Generally a favorable nutrient in higher amounts.",
  "Saturated fat": "Linked to raised LDL cholesterol with regular high intake. General guidance: keep under ~10% of daily energy.",
  Fibre: "Supports digestion; generally under-consumed in typical diets. Higher is favorable.",
};

const FACTOR_LABELS = {
  sugar: "sugar", sugar_g: "sugar",
  sodium: "sodium", sodium_mg: "sodium",
  satFat: "saturated fat", sat_fat_g: "saturated fat",
  energy: "calorie content", energy_kcal: "calorie content",
};

function friendlyConcernSentence(factorKey) {
  if (!factorKey) return "No standout concern was found in this product.";
  const label = FACTOR_LABELS[factorKey] || factorKey;
  return `The main thing to watch in this product is its ${label} — it's on the higher side for this category.`;
}

// General reference bands, similar in spirit to UK FSA traffic-light labeling —
// not the FoodScore engine's internal thresholds, just a plain-language layer on top.
function classifyNutrients(n) {
  const positives = [];
  const concerns = [];
  if (n.protein_g != null && n.protein_g >= 5) positives.push("Good source of protein");
  if (n.fiber_g != null && n.fiber_g >= 3) positives.push(n.fiber_g >= 6 ? "High in fibre" : "Good source of fibre");
  if (n.sugar_g != null && n.sugar_g <= 5) positives.push("Low in sugar");
  if (n.sat_fat_g != null && n.sat_fat_g <= 1.5) positives.push("Low in saturated fat");
  if (n.sodium_mg != null && n.sodium_mg <= 120) positives.push("Low in sodium");
  if (n.sugar_g != null && n.sugar_g > 22.5) concerns.push("High in sugar");
  if (n.sat_fat_g != null && n.sat_fat_g > 5) concerns.push("High in saturated fat");
  if (n.sodium_mg != null && n.sodium_mg > 600) concerns.push("High in sodium");
  return { positives, concerns };
}

export default function ScanInput({ mode = "verify" }) {
  const showBarcode = mode !== "photo";
  const showPhoto = mode !== "barcode";

  const [barcode, setBarcode] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [manualName, setManualName] = useState("");
  const [category, setCategory] = useState("snacks");
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [product, setProduct] = useState(null);
  const [score, setScore] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function runOcr(file) {
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/ocr-vision", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Vision OCR failed");
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      return { nutrition: result, meta: { ocrEngine: "gemini-vision", ocrConfidence: null } };
    } catch (err) {
      console.warn("Vision OCR unavailable, falling back to Tesseract:", err.message);
      const data = await recognizeLabel(file);
      return { nutrition: parseNutrition(data), meta: { ocrEngine: "tesseract", ocrConfidence: data.confidence ?? null } };
    }
  }

  async function handleSubmit() {
    try {
      setStatus("loading");
      setErrorMessage("");
      setScore(null);
      setProduct(null);
      setAiSummary(null);

      let lookup = null;
      if (showBarcode && barcode.trim()) {
        const lookupRes = await fetch(`/api/barcode/${encodeURIComponent(barcode.trim())}`);
        if (lookupRes.ok) {
          const data = await lookupRes.json();
          if (data.found) lookup = data;
        }
      }

      let ocr = null;
      let ocrMeta = null;
      if (showPhoto && imageFile) {
        const result = await runOcr(imageFile);
        ocr = result.nutrition;
        ocrMeta = result.meta;
      }

      if (!lookup && !ocr) {
        setStatus("error");
        setErrorMessage("Nothing found — check the barcode or photo.");
        return;
      }
      if (!lookup && ocr && !manualName.trim()) {
        setStatus("error");
        setErrorMessage("Please enter a product name for label-only scans.");
        return;
      }

      const productName = lookup ? lookup.productName : manualName.trim();
      setProduct({ productName, imageUrl: lookup?.imageUrl || imagePreview || null });

      const hasBothSources = Boolean(lookup && ocr);
      const nutritionPer100 = lookup ? lookup.nutritionPer100 : ocr;

      const scoreRes = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: barcode || null,
          productName,
          category,
          source: { barcodeUsed: Boolean(lookup), ocrUsed: Boolean(ocr) },
          quality: ocrMeta,
          nutritionPer100,
          reconciliation: hasBothSources
            ? { hasBothSources: true, barcodeValues: lookup.nutritionPer100, ocrValues: ocr }
            : { hasBothSources: false },
        }),
      });
      if (!scoreRes.ok) throw new Error(`Score API failed (${scoreRes.status})`);
      const scored = await scoreRes.json();
      setScore(scored);

      if (scored.scoreStatus === "CALCULATED") {
        const explainRes = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName, overallScore: scored.foodScore, grade: scored.starDisplay, nutritionPer100,
            whyThisResult: [`Strongest concern: ${scored.explanationData?.strongestNegativeFactor?.factor ?? "none"}`],
          }),
        });
        const explained = await explainRes.json();
        setAiSummary(explained.aiSummary);
      }
      setStatus("done");
    } catch (error) {
      console.error("Scan failed:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong while scanning.");
    }
  }

  //const nutrientCheck = score?.normalizedNutrition ? classifyNutrients(score.normalizedNutrition) : { positives: [], concerns: [] };
  const nutrientCheck = score?.nutritionPer100 ? classifyNutrients(score.nutritionPer100) : { positives: [], concerns: [] };


  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] p-6">
      {showBarcode && (
        <>
          <label className="text-sm text-[var(--ink-dim)]">
            Barcode number{mode === "verify" ? "" : " "}
          </label>
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="8901234567890"
            className="font-mono mt-2 w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </>
      )}

      <label className="mt-4 block text-sm text-[var(--ink-dim)]">
        Category
      </label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="mt-2 w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
      >
        <option value="snacks">Snacks</option>
      </select>

      {showPhoto && (
        <>
          <label className="mt-4 block text-sm text-[var(--ink-dim)]">
            Label photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-2 w-full text-sm"
          />
        </>
      )}

      {mode !== "barcode" && (
        <>
          <label className="mt-4 block text-sm text-[var(--ink-dim)]">
            Product name (required if no barcode)
          </label>
          <input
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="e.g. GoodDay Choco Chip"
            className="mt-2 w-full rounded-md border border-[var(--line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </>
      )}

      <button
        onClick={handleSubmit}
        disabled={status === "loading"}
        className="mt-4 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? "Scanning…" : "Scan"}
      </button>

      {status === "error" && (
        <div
          className="mt-4 rounded-md border border-[var(--alert)]/30 bg-[var(--alert)]/10 px-3 py-2 text-sm"
          style={{ color: "var(--alert)" }}
        >
          {errorMessage}
        </div>
      )}

      {/* {product && score && score.scoreStatus === "CALCULATED" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-6 overflow-hidden rounded-md border-2 border-[var(--ink)]">
          {product.imageUrl && (
            <img src={product.imageUrl} alt={product.productName} className="h-40 w-full border-b-2 border-[var(--ink)] object-contain bg-white p-2" />
          )}

          <div className="border-b-2 border-[var(--ink)] bg-[var(--bg-elevated)] px-4 py-3">
            <p className="font-display text-base font-medium">{product.productName}</p>
            <div className="mt-1 flex items-center gap-2">
              <StarRating rating={score.starRating} />
              <span className="text-sm text-[var(--ink-dim)]">
                FoodScore: {score.foodScore}
                <InfoTooltip text="Based on an adaptation of FSSAI's draft Indian Nutrition Rating (INR) framework. Energy, sugar, saturated fat, and sodium each earn penalty points — only the worst factor counts toward your score. Protein and fibre earn capped bonus points, subtracted from it. Lower FoodScore means fewer concerns, shown as more stars. Not medical advice." />
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--ink-dim)]">
              <span className="rounded-full border border-[var(--line)] px-2 py-0.5">
                {score.source?.barcodeUsed && score.source?.ocrUsed
                  ? score.mismatchCheck?.hasMismatch ? "Barcode + Label (mismatch flagged)" : "Barcode + Label (verified match)"
                  : score.source?.barcodeUsed ? "Source: Open Food Facts"
                  : score.source?.ocrUsed ? "Source: Label scan" : "Source: unknown"}
              </span>
              {score.quality?.ocrEngine === "tesseract" && score.quality?.ocrConfidence != null && (
                <span>OCR confidence: {Math.round(score.quality.ocrConfidence)}%</span>
              )}
              {score.quality?.ocrEngine === "gemini-vision" && <span>Label read via AI vision</span>}
            </div>
            {aiSummary && <p className="mt-1 text-sm italic text-[var(--ink-dim)]">{aiSummary}</p>}
          </div>

          <div className="divide-y divide-[var(--line)]">
            <p className="px-4 py-2 text-xs uppercase tracking-wide text-[var(--ink-dim)]">Per 100g</p>
            {[
              ["Energy", score.normalizedNutrition.energy_kcal, "kcal"],
              ["Sugar", score.normalizedNutrition.sugar_g, "g"],
              ["Sodium", score.normalizedNutrition.sodium_mg, "mg"],
              ["Protein", score.normalizedNutrition.protein_g, "g"],
              ["Saturated fat", score.normalizedNutrition.sat_fat_g, "g"],
              ["Fibre", score.normalizedNutrition.fiber_g, "g"],
            ].map(([label, value, unit], i) => (
              <motion.div key={label} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: 0.1 + i * 0.05 }} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="flex items-center text-[var(--ink-dim)]">{label}<InfoTooltip text={NUTRIENT_INFO[label]} /></span>
                <span className="font-mono">{value ?? "—"} {value != null ? unit : ""}</span>
              </motion.div>
            ))}
          </div>

          <div className="border-t border-[var(--line)] px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[var(--ink-dim)]">Why this result</p>
            <p className="mt-2 text-sm text-[var(--ink-dim)]">{friendlyConcernSentence(score.explanationData?.strongestNegativeFactor?.factor)}</p>

            {(nutrientCheck.positives.length > 0 || nutrientCheck.concerns.length > 0) && (
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--good)" }}>Positives</p>
                  <ul className="mt-1 space-y-1 text-[var(--ink-dim)]">
                    {nutrientCheck.positives.length ? nutrientCheck.positives.map((p) => <li key={p}>+ {p}</li>) : <li>—</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--alert)" }}>Concerns</p>
                  <ul className="mt-1 space-y-1 text-[var(--ink-dim)]">
                    {nutrientCheck.concerns.length ? nutrientCheck.concerns.map((c) => <li key={c}>− {c}</li>) : <li>—</li>}
                  </ul>
                </div>
              </div>
            )}
            <p className="mt-2 text-[10px] text-[var(--ink-dim)]">Based on general reference bands, similar to UK FSA-style labeling. Not personalized advice.</p>
          </div>

          {score.mismatchCheck?.hasMismatch && (
            <div className="border-t border-[var(--line)] px-4 py-3 text-xs" style={{ color: "var(--alert)", background: "rgba(178,59,59,0.06)" }}>
              Mismatch ({score.mismatchCheck.severity}): {score.mismatchCheck.fields.map((f) => f.field).join(", ")}
            </div>
          )}
        </motion.div>
      )}

      {score && score.scoreStatus !== "CALCULATED" && (
        <div className="mt-6 rounded-md border border-[var(--line)] px-4 py-3 text-sm text-[var(--ink-dim)]">Score not available: {score.reason}</div>
      )} */}

      {product && score && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-6 overflow-hidden rounded-md border-2 border-[var(--ink)]"
        >
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.productName}
              className="h-40 w-full border-b-2 border-[var(--ink)] object-contain bg-white p-2"
            />
          )}

          <div className="border-b-2 border-[var(--ink)] bg-[var(--bg-elevated)] px-4 py-3">
            <p className="font-display text-base font-medium">
              {product.productName}
            </p>

            {score.scoreStatus === "CALCULATED" ? (
              <>
                <div className="mt-1 flex items-center gap-2">
                  <StarRating rating={score.starRating} />
                  <span className="text-sm text-[var(--ink-dim)]">
                    FoodScore: {score.foodScore}
                    <InfoTooltip text="Based on an adaptation of FSSAI's draft Indian Nutrition Rating (INR) framework. Energy, sugar, saturated fat, and sodium each earn penalty points — only the worst factor counts toward your score. Protein and fibre earn capped bonus points, subtracted from it. Lower FoodScore means fewer concerns, shown as more stars. Not medical advice." />
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--ink-dim)]">
                  <span className="rounded-full border border-[var(--line)] px-2 py-0.5">
                    {score.source?.barcodeUsed && score.source?.ocrUsed
                      ? score.mismatchCheck?.hasMismatch
                        ? "Barcode + Label (mismatch flagged)"
                        : "Barcode + Label (verified match)"
                      : score.source?.barcodeUsed
                        ? "Source: Open Food Facts"
                        : score.source?.ocrUsed
                          ? "Source: Label scan"
                          : "Source: unknown"}
                  </span>
                  {score.quality?.ocrEngine === "tesseract" &&
                    score.quality?.ocrConfidence != null && (
                      <span>
                        OCR confidence:{" "}
                        {Math.round(score.quality.ocrConfidence)}%
                      </span>
                    )}
                  {score.quality?.ocrEngine === "gemini-vision" && (
                    <span>Label read via AI vision</span>
                  )}
                </div>
                {aiSummary && (
                  <p className="mt-1 text-sm italic text-[var(--ink-dim)]">
                    {aiSummary}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm text-[var(--ink-dim)]">
                FoodScore not available —{" "}
                {score.reason === "UNKNOWN_OR_UNSUPPORTED_CATEGORY"
                  ? "category not scored yet"
                  : "missing a required nutrient value below"}
                .
              </p>
            )}
          </div>

          <div className="divide-y divide-[var(--line)]">
            <p className="px-4 py-2 text-xs uppercase tracking-wide text-[var(--ink-dim)]">
              Per 100g
            </p>
            {[
              ["Energy", score.nutritionPer100?.energy_kcal, "kcal"],
              ["Sugar", score.nutritionPer100?.sugar_g, "g"],
              ["Sodium", score.nutritionPer100?.sodium_mg, "mg"],
              ["Protein", score.nutritionPer100?.protein_g, "g"],
              ["Saturated fat", score.nutritionPer100?.sat_fat_g, "g"],
              ["Fibre", score.nutritionPer100?.fiber_g, "g"],
            ].map(([label, value, unit], i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.1 + i * 0.05 }}
                className="flex items-center justify-between px-4 py-2 text-sm"
              >
                <span className="flex items-center text-[var(--ink-dim)]">
                  {label}
                  {NUTRIENT_INFO[label] && (
                    <InfoTooltip text={NUTRIENT_INFO[label]} />
                  )}
                </span>
                <span className="font-mono">
                  {value ?? "—"} {value != null ? unit : ""}
                </span>
              </motion.div>
            ))}
          </div>

          {score.scoreStatus === "CALCULATED" && (
            <div className="border-t border-[var(--line)] px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-dim)]">
                Why this result
              </p>
              <p className="mt-2 text-sm text-[var(--ink-dim)]">
                {friendlyConcernSentence(
                  score.explanationData?.strongestNegativeFactor?.factor,
                )}
              </p>
              {(nutrientCheck.positives.length > 0 ||
                nutrientCheck.concerns.length > 0) && (
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--good)" }}
                    >
                      Positives
                    </p>
                    <ul className="mt-1 space-y-1 text-[var(--ink-dim)]">
                      {nutrientCheck.positives.length ? (
                        nutrientCheck.positives.map((p) => (
                          <li key={p}>+ {p}</li>
                        ))
                      ) : (
                        <li>—</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--alert)" }}
                    >
                      Concerns
                    </p>
                    <ul className="mt-1 space-y-1 text-[var(--ink-dim)]">
                      {nutrientCheck.concerns.length ? (
                        nutrientCheck.concerns.map((c) => (
                          <li key={c}>− {c}</li>
                        ))
                      ) : (
                        <li>—</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {score.mismatchCheck?.hasMismatch && (
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