// Rulebook v1 — weights and bands as locked with the Rulebook team.
// Swap these constants for rules_contract_v1.json once that's frozen.

const WEIGHTS = { sugar: 0.35, sodium: 0.30, protein: 0.20, satFat: 0.15 };

const GRADE_BANDS = [
  { min: 80, grade: "Excellent" },
  { min: 60, grade: "Good" },
  { min: 40, grade: "Moderate" },
  { min: 0, grade: "Poor" },
];

export function gradeFromScore(score) {
  return GRADE_BANDS.find((b) => score >= b.min).grade;
}

// TODO: replace with real per-metric scoring curves once the Rulebook
// team's validation sheet (ground-truth based) is ready.
export function computeScore(nutritionPer100) {
  // placeholder scoring — wire up real thresholds before demo
  const sugarScore = Math.max(0, 100 - nutritionPer100.sugar_g * 3);
  const sodiumScore = Math.max(0, 100 - nutritionPer100.sodium_mg / 8);
  const proteinScore = Math.min(100, nutritionPer100.protein_g * 8);
  const satFatScore = Math.max(0, 100 - nutritionPer100.sat_fat_g * 6);

  const overallScore = Math.round(
    sugarScore * WEIGHTS.sugar +
    sodiumScore * WEIGHTS.sodium +
    proteinScore * WEIGHTS.protein +
    satFatScore * WEIGHTS.satFat
  );

  return {
    overallScore,
    grade: gradeFromScore(overallScore),
    metricScores: { sugarScore, sodiumScore, proteinScore, satFatScore },
  };
}

export function checkMismatch(barcodeValues, ocrValues) {
  const fields = [];
  for (const key of Object.keys(barcodeValues)) {
    const a = barcodeValues[key];
    const b = ocrValues[key];
    if (a == null || b == null) continue;
    const diffPercent = (Math.abs(a - b) / Math.max(a, 1)) * 100;
    if (diffPercent > 10) {
      fields.push({ field: key, barcodeValue: a, ocrValue: b, differencePercent: Math.round(diffPercent * 10) / 10 });
    }
  }
  const severity = fields.some((f) => f.differencePercent > 20) ? "high" : fields.length ? "warning" : "none";
  return { hasMismatch: fields.length > 0, severity, fields };
}
