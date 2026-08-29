/*
 * LabelSense FoodScore v1
 *
 * Deterministic nutrient-profile scoring.
 *
 * Reference framework:
 * FSSAI 2022 Draft Indian Nutrition Rating (INR)
 *
 * IMPORTANT:
 * This is an INR-aligned LabelSense adaptation for the project.
 * It is NOT presented as a current mandatory FSSAI rating.
 *
 * Solid-food MVP:
 *   Negative factors:
 *     - Energy
 *     - Total sugars
 *     - Saturated fat
 *     - Sodium
 *
 *   Positive factors:
 *     - Protein
 *     - Fibre
 *
 * Formula:
 *
 *   Baseline Points =
 *     MAX(Energy, Sugar, Saturated Fat, Sodium)
 *
 *   Positive Points =
 *     capped Protein + capped Fibre
 *
 *   FoodScore =
 *     Baseline Points - Positive Points
 *
 * Final FoodScore is converted to INR-style stars.
 */

const FOODSCORE_VERSION = "v1";
const REFERENCE_FRAMEWORK = "FSSAI INR 2022 draft";

// ------------------------------------------------------------
// FSSAI INR SOLID FOOD POINT BANDS
// ------------------------------------------------------------

/*
 * Each threshold means:
 *
 * <= threshold[0] => 0 points
 * > threshold[0] => 1 point
 * > threshold[1] => 2 points
 * ...
 *
 * Therefore exact threshold values stay in the lower point band.
 */

// Energy: kcal / 100 g
const ENERGY_THRESHOLDS = [
  80,
  160,
  240,
  320,
  400,
  480,
  560,
  640,
  720,
  800,
];

// Total sugars: g / 100 g
const SUGAR_THRESHOLDS = [
  4.2,
  8.4,
  12.6,
  16.8,
  21,
  25.2,
  29.4,
  33.6,
  37.8,
  42,
  46.2,
  50.4,
  54.6,
  58.8,
  63,
  67.2,
  71.4,
  75.6,
  79.8,
  84,
];

// Saturated fat: g / 100 g
const SAT_FAT_THRESHOLDS = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  12,
  14,
  16,
  18,
  20,
  22,
  24,
  26,
  28,
  30,
];

// Sodium: mg / 100 g
const SODIUM_THRESHOLDS = [
  90,
  180,
  270,
  360,
  450,
  540,
  630,
  720,
  810,
  900,
  990,
  1080,
  1170,
  1260,
  1350,
  1440,
  1530,
  1620,
  1710,
  1800,
  1890,
  1980,
  2070,
  2160,
  2250,
];

// Protein: g / 100 g
const PROTEIN_THRESHOLDS = [
  1.5,
  2,
  2.5,
  3,
  5,
  7,
  10,
  15,
  20,
  25,
  30,
  35,
  40,
  45,
  50,
];

// Dietary fibre: g / 100 g
const FIBRE_THRESHOLDS = [
  3,
  6,
  9,
  12,
  15,
  18,
  21,
  24,
  27,
  30,
];

// ------------------------------------------------------------
// STAR MAPPING
// ------------------------------------------------------------

/*
 * FSSAI INR-style solid-food final score mapping:
 *
 * <= -11       => 5 stars
 * -10 to -7    => 4.5 stars
 * -6 to -2     => 4 stars
 * -1 to 2      => 3.5 stars
 * 3 to 6       => 3 stars
 * 7 to 11      => 2.5 stars
 * 12 to 15     => 2 stars
 * 16 to 20     => 1.5 stars
 * 21 to 24     => 1 star
 * >= 25        => 0.5 star
 */

const STAR_BANDS = [
  { max: -11, stars: 5 },
  { max: -7, stars: 4.5 },
  { max: -2, stars: 4 },
  { max: 2, stars: 3.5 },
  { max: 6, stars: 3 },
  { max: 11, stars: 2.5 },
  { max: 15, stars: 2 },
  { max: 20, stars: 1.5 },
  { max: 24, stars: 1 },
  { max: Infinity, stars: 0.5 },
];

export function starsFromFoodScore(foodScore) {
  if (!Number.isFinite(foodScore)) {
    return null;
  }

  const band = STAR_BANDS.find(
    (band) => foodScore <= band.max
  );

  return band ? band.stars : null;
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function isValidNumber(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
}

function pointsFromThresholds(value, thresholds) {
  if (!isValidNumber(value)) {
    return null;
  }

  let points = 0;

  for (const threshold of thresholds) {
    if (value > threshold) {
      points += 1;
    } else {
      break;
    }
  }

  return points;
}

// ------------------------------------------------------------
// INPUT VALIDATION
// ------------------------------------------------------------

export function validateNutrition(nutritionPer100) {
  if (!nutritionPer100 || typeof nutritionPer100 !== "object") {
    return {
      valid: false,
      reason: "MISSING_REQUIRED_NUTRIENT",
    };
  }

  const required = {
    energy_kcal: nutritionPer100.energy_kcal,
    sugar_g: nutritionPer100.sugar_g,
    sat_fat_g: nutritionPer100.sat_fat_g,
    sodium_mg: nutritionPer100.sodium_mg,
    protein_g: nutritionPer100.protein_g,
  };

  for (const [field, value] of Object.entries(required)) {
    if (!isValidNumber(value)) {
      return {
        valid: false,
        reason: `MISSING_OR_INVALID_${field.toUpperCase()}`,
      };
    }
  }

  // Fibre is optional.
  if (
    nutritionPer100.fiber_g !== null &&
    nutritionPer100.fiber_g !== undefined &&
    !isValidNumber(nutritionPer100.fiber_g)
  ) {
    return {
      valid: false,
      reason: "INVALID_FIBRE_VALUE",
    };
  }

  return {
    valid: true,
    reason: null,
  };
}

// ------------------------------------------------------------
// SOLID FOOD SCORING
// ------------------------------------------------------------

export function computeScore(nutritionPer100) {
  const validation = validateNutrition(nutritionPer100);

  if (!validation.valid) {
    return {
      foodScoreVersion: FOODSCORE_VERSION,
      referenceFramework: REFERENCE_FRAMEWORK,

      scoreStatus: "NOT_AVAILABLE",
      reason: validation.reason,

      foodScore: null,
      starRating: null,
      starDisplay: null,

      nutrientPoints: null,
      baselinePoints: null,
      positivePoints: null,

      normalizedNutrition: nutritionPer100 ?? null,
    };
  }

  // ----------------------------------------------------------
  // NEGATIVE FACTOR POINTS
  // ----------------------------------------------------------

  const energyPoints = pointsFromThresholds(
    nutritionPer100.energy_kcal,
    ENERGY_THRESHOLDS
  );

  const sugarPoints = pointsFromThresholds(
    nutritionPer100.sugar_g,
    SUGAR_THRESHOLDS
  );

  const satFatPoints = pointsFromThresholds(
    nutritionPer100.sat_fat_g,
    SAT_FAT_THRESHOLDS
  );

  const sodiumPoints = pointsFromThresholds(
    nutritionPer100.sodium_mg,
    SODIUM_THRESHOLDS
  );

  // IMPORTANT:
  // Do NOT add these.
  //
  // Baseline = maximum negative factor.
  const baselinePoints = Math.max(
    energyPoints,
    sugarPoints,
    satFatPoints,
    sodiumPoints
  );

  // ----------------------------------------------------------
  // POSITIVE FACTOR POINTS
  // ----------------------------------------------------------

  const proteinPoints = pointsFromThresholds(
    nutritionPer100.protein_g,
    PROTEIN_THRESHOLDS
  );

  const fibreAvailable =
    nutritionPer100.fiber_g !== null &&
    nutritionPer100.fiber_g !== undefined;

  const fibrePoints = fibreAvailable
    ? pointsFromThresholds(
        nutritionPer100.fiber_g,
        FIBRE_THRESHOLDS
      )
    : null;

  // ----------------------------------------------------------
  // POSITIVE POINT CAPS
  // ----------------------------------------------------------

  let proteinCap;
  let fibreCap;

  if (baselinePoints <= 20) {
    proteinCap = 15;
    fibreCap = 10;
  } else {
    proteinCap = 7;
    fibreCap = 5;
  }

  const cappedProteinPoints = Math.min(
    proteinPoints,
    proteinCap
  );

  const cappedFibrePoints =
    fibreAvailable
      ? Math.min(fibrePoints, fibreCap)
      : 0;

  const positivePoints =
    cappedProteinPoints +
    cappedFibrePoints;

  // ----------------------------------------------------------
  // FINAL FOODSCORE
  // ----------------------------------------------------------

  const foodScore =
    baselinePoints - positivePoints;

  const starRating =
    starsFromFoodScore(foodScore);

  const starDisplay =
    "★".repeat(Math.floor(starRating)) +
    (starRating % 1 === 0.5 ? "½" : "") +
    "☆".repeat(
      5 -
        Math.floor(starRating) -
        (starRating % 1 === 0.5 ? 1 : 0)
    );

  // ----------------------------------------------------------
  // RETURN TRACEABLE RESULT
  // ----------------------------------------------------------

  return {
    foodScoreVersion: FOODSCORE_VERSION,
    referenceFramework: REFERENCE_FRAMEWORK,

    scoreStatus: "CALCULATED",

    foodScore,
    starRating,
    starDisplay,

    nutrientPoints: {
      negative: {
        energy: energyPoints,
        totalSugar: sugarPoints,
        saturatedFat: satFatPoints,
        sodium: sodiumPoints,
      },

      positive: {
        protein: proteinPoints,
        fibre: fibreAvailable
          ? fibrePoints
          : null,
      },

      cappedPositive: {
        protein: cappedProteinPoints,
        fibre: cappedFibrePoints,
      },
    },

    baselinePoints,

    positivePoints,

    normalizedNutrition: nutritionPer100,

    caps: {
      protein: proteinCap,
      fibre: fibreCap,
    },

    fibreAvailable,

    explanationData: {
      strongestNegativeFactor:
        getStrongestNegativeFactor({
          energy: energyPoints,
          totalSugar: sugarPoints,
          saturatedFat: satFatPoints,
          sodium: sodiumPoints,
        }),

      positiveFactorsUsed: [
        "protein",
        ...(fibreAvailable ? ["fibre"] : []),
      ],
    },
  };
}

// ------------------------------------------------------------
// STRONGEST NEGATIVE FACTOR
// ------------------------------------------------------------

function getStrongestNegativeFactor(points) {
  const entries = Object.entries(points);

  entries.sort((a, b) => b[1] - a[1]);

  const [factor, value] = entries[0];

  return {
    factor,
    points: value,
  };
}

// ------------------------------------------------------------
// DATABASE / OCR MISMATCH
// ------------------------------------------------------------

export function checkMismatch(
  barcodeValues,
  ocrValues
) {
  const fields = [];

  if (!barcodeValues || !ocrValues) {
    return {
      hasMismatch: false,
      severity: "none",
      fields: [],
    };
  }

  const keys = new Set([
    ...Object.keys(barcodeValues),
    ...Object.keys(ocrValues),
  ]);

  for (const key of keys) {
    const a = barcodeValues[key];
    const b = ocrValues[key];

    if (
      a === null ||
      a === undefined ||
      b === null ||
      b === undefined
    ) {
      continue;
    }

    if (
      !Number.isFinite(a) ||
      !Number.isFinite(b)
    ) {
      continue;
    }

    if (a === b) {
      continue;
    }

    const differencePercent =
      (Math.abs(a - b) /
        Math.max(Math.abs(a), 1)) *
      100;

    if (differencePercent > 10) {
      fields.push({
        field: key,
        barcodeValue: a,
        ocrValue: b,
        differencePercent:
          Math.round(differencePercent * 10) / 10,
      });
    }
  }

  const severity =
    fields.some(
      (field) =>
        field.differencePercent > 20
    )
      ? "high"
      : fields.length > 0
        ? "warning"
        : "none";

  return {
    hasMismatch: fields.length > 0,
    severity,
    fields,
  };
}