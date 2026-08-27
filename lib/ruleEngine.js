// LabelSense FoodScore v1
//
// Scoring foundation:
// - FSSAI INR 2022 draft reference methodology
// - LabelSense data-quality safeguards
// - Solid packaged-food scoring for the current MVP
//
// IMPORTANT:
// LabelSense FoodScore is NOT an official FSSAI rating.
// FSSAI INR is used as the reference methodology.


// ============================================================
// 1. LABELSENSE GRADE BANDS
// ============================================================

const GRADE_BANDS = [
  { min: 80, grade: "A" },
  { min: 60, grade: "B" },
  { min: 40, grade: "C" },
  { min: 20, grade: "D" },
  { min: 0, grade: "E" },
];


// ============================================================
// 2. FSSAI INR SOLID-FOOD NEGATIVE POINT TABLE
//    Values are per 100 g
// ============================================================

const SOLID_NEGATIVE_BANDS = {
  energy: [
    { max: 80, points: 0 },
    { max: 160, points: 1 },
    { max: 240, points: 2 },
    { max: 320, points: 3 },
    { max: 400, points: 4 },
    { max: 480, points: 5 },
    { max: 560, points: 6 },
    { max: 640, points: 7 },
    { max: 720, points: 8 },
    { max: 800, points: 9 },
    { max: Infinity, points: 10 },
  ],

  saturatedFat: [
    { max: 1, points: 0 },
    { max: 2, points: 1 },
    { max: 3, points: 2 },
    { max: 4, points: 3 },
    { max: 5, points: 4 },
    { max: 6, points: 5 },
    { max: 7, points: 6 },
    { max: 8, points: 7 },
    { max: 9, points: 8 },
    { max: 10, points: 9 },
    { max: 12, points: 10 },
    { max: 14, points: 11 },
    { max: 16, points: 12 },
    { max: 18, points: 13 },
    { max: 20, points: 14 },
    { max: 22, points: 15 },
    { max: 24, points: 16 },
    { max: 26, points: 17 },
    { max: 28, points: 18 },
    { max: 30, points: 19 },
    { max: 32, points: 20 },
    { max: 34, points: 21 },
    { max: 36, points: 22 },
    { max: 38, points: 23 },
    { max: 40, points: 24 },
    { max: Infinity, points: 25 },
  ],

  sugar: [
    { max: 4.2, points: 0 },
    { max: 8.4, points: 1 },
    { max: 12.6, points: 2 },
    { max: 16.8, points: 3 },
    { max: 21, points: 4 },
    { max: 25.2, points: 5 },
    { max: 29.4, points: 6 },
    { max: 33.6, points: 7 },
    { max: 37.8, points: 8 },
    { max: 42, points: 9 },
    { max: 46.2, points: 10 },
    { max: 50.4, points: 11 },
    { max: 54.6, points: 12 },
    { max: 58.8, points: 13 },
    { max: 63, points: 14 },
    { max: 67.2, points: 15 },
    { max: 71.4, points: 16 },
    { max: 75.6, points: 17 },
    { max: 79.8, points: 18 },
    { max: 84, points: 19 },
    { max: Infinity, points: 20 },
  ],

  sodium: [
    { max: 90, points: 0 },
    { max: 180, points: 1 },
    { max: 270, points: 2 },
    { max: 360, points: 3 },
    { max: 450, points: 4 },
    { max: 540, points: 5 },
    { max: 630, points: 6 },
    { max: 720, points: 7 },
    { max: 810, points: 8 },
    { max: 900, points: 9 },
    { max: 990, points: 10 },
    { max: 1080, points: 11 },
    { max: 1170, points: 12 },
    { max: 1260, points: 13 },
    { max: 1350, points: 14 },
    { max: 1440, points: 15 },
    { max: 1530, points: 16 },
    { max: 1620, points: 17 },
    { max: 1710, points: 18 },
    { max: 1800, points: 19 },
    { max: 1890, points: 20 },
    { max: 1980, points: 21 },
    { max: 2070, points: 22 },
    { max: 2160, points: 23 },
    { max: 2250, points: 24 },
    { max: Infinity, points: 25 },
  ],
};


// ============================================================
// 3. FSSAI INR SOLID-FOOD POSITIVE POINT TABLE
//    Values are per 100 g
// ============================================================

const POSITIVE_BANDS = {
  protein: [
    { max: 1.5, points: 0 },
    { max: 2, points: 1 },
    { max: 2.5, points: 2 },
    { max: 3, points: 3 },
    { max: 5, points: 4 },
    { max: 7, points: 5 },
    { max: 10, points: 6 },
    { max: 15, points: 7 },
    { max: 20, points: 8 },
    { max: 25, points: 9 },
    { max: Infinity, points: 10 },
  ],

  fibre: [
    { max: 3, points: 0 },
    { max: 6, points: 1 },
    { max: 9, points: 2 },
    { max: 12, points: 3 },
    { max: 15, points: 4 },
    { max: 18, points: 5 },
    { max: 21, points: 6 },
    { max: 24, points: 7 },
    { max: 27, points: 8 },
    { max: 30, points: 9 },
    { max: Infinity, points: 10 },
  ],
};


// ============================================================
// 4. HELPER — GET POINTS FROM A THRESHOLD TABLE
// ============================================================

function pointsFromBands(value, bands) {
  for (const band of bands) {
    if (value <= band.max) {
      return band.points;
    }
  }

  return null;
}


// ============================================================
// 5. INPUT VALIDATION
// ============================================================

function isValidNumber(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
}

function validateRequiredNutrition(nutrition) {
  if (!nutrition || typeof nutrition !== "object") {
    return {
      valid: false,
      reason: "INVALID_INPUT",
    };
  }

  const requiredFields = [
    "energy_kcal",
    "sugar_g",
    "sodium_mg",
    "sat_fat_g",
  ];

  for (const field of requiredFields) {
    if (!isValidNumber(nutrition[field])) {
      return {
        valid: false,
        reason: `MISSING_OR_INVALID_${field.toUpperCase()}`,
      };
    }
  }

  return {
    valid: true,
    reason: null,
  };
}


// ============================================================
// 6. GRADE
// ============================================================

export function gradeFromScore(score) {
  if (!Number.isFinite(score)) {
    return "E";
  }

  const band = GRADE_BANDS.find(
    (item) => score >= item.min
  );

  return band ? band.grade : "E";
}


// ============================================================
// 7. CONVERT RAW INR-STYLE SCORE TO LABELSENSE 0–100
//
// This is the consumer-facing LabelSense presentation layer.
// It is NOT an FSSAI score.
//
// Formula selected in the research:
// ROUND((25 - FoodScore) * 2)
// then clamp to 0–100.
// ============================================================

function toLabelSenseScore(rawScore) {
  const score = Math.round((25 - rawScore) * 2);

  return Math.max(
    0,
    Math.min(100, score)
  );
}


// ============================================================
// 8. COMPUTE SCORE
// ============================================================

export function computeScore(nutritionPer100) {
  const validation = validateRequiredNutrition(
    nutritionPer100
  );

  if (!validation.valid) {
    return {
      overallScore: null,
      grade: null,

      scoreStatus: "NOT_AVAILABLE",
      scoreReason: validation.reason,

      rawINRScore: null,

      metricScores: {
        sugarScore: null,
        sodiumScore: null,
        proteinScore: null,
        satFatScore: null,
      },

      pointBreakdown: null,
    };
  }


  // ----------------------------------------------------------
  // NEGATIVE POINTS
  // ----------------------------------------------------------

  const energyPoints = pointsFromBands(
    nutritionPer100.energy_kcal,
    SOLID_NEGATIVE_BANDS.energy
  );

  const sugarPoints = pointsFromBands(
    nutritionPer100.sugar_g,
    SOLID_NEGATIVE_BANDS.sugar
  );

  const saturatedFatPoints = pointsFromBands(
    nutritionPer100.sat_fat_g,
    SOLID_NEGATIVE_BANDS.saturatedFat
  );

  const sodiumPoints = pointsFromBands(
    nutritionPer100.sodium_mg,
    SOLID_NEGATIVE_BANDS.sodium
  );


  // IMPORTANT:
  // INR-style baseline = SUM of negative points.
  const baselinePoints =
    energyPoints +
    sugarPoints +
    saturatedFatPoints +
    sodiumPoints;


  // ----------------------------------------------------------
  // POSITIVE POINTS
  // ----------------------------------------------------------

  let proteinPoints = 0;
  let fibrePoints = 0;

  const hasProtein = isValidNumber(
    nutritionPer100.protein_g
  );

  const hasFibre = isValidNumber(
    nutritionPer100.fiber_g
  );


  if (hasProtein) {
    proteinPoints = pointsFromBands(
      nutritionPer100.protein_g,
      POSITIVE_BANDS.protein
    );
  }

  if (hasFibre) {
    fibrePoints = pointsFromBands(
      nutritionPer100.fiber_g,
      POSITIVE_BANDS.fibre
    );
  }


  // ----------------------------------------------------------
  // POSITIVE-POINT CAPS
  // ----------------------------------------------------------

  const highBaseline = baselinePoints > 20;

  const proteinCap = highBaseline ? 7 : 15;
  const fibreCap = highBaseline ? 5 : 10;

  proteinPoints = Math.min(
    proteinPoints,
    proteinCap
  );

  fibrePoints = Math.min(
    fibrePoints,
    fibreCap
  );


  const positivePoints =
    proteinPoints +
    fibrePoints;


  // ----------------------------------------------------------
  // FINAL RAW SCORE
  // ----------------------------------------------------------

  const rawINRScore =
    baselinePoints - positivePoints;


  // ----------------------------------------------------------
  // LABELSENSE CONSUMER SCORE
  // ----------------------------------------------------------

  const overallScore =
    toLabelSenseScore(rawINRScore);

  const grade =
    gradeFromScore(overallScore);


  // ----------------------------------------------------------
  // METRIC DISPLAY SCORES
  //
  // These are UI-friendly 0–100 values.
  // They do NOT affect the overall calculation.
  // ----------------------------------------------------------

  const sugarScore = Math.max(
    0,
    Math.round(
      100 -
      (sugarPoints / 20) * 100
    )
  );

  const sodiumScore = Math.max(
    0,
    Math.round(
      100 -
      (sodiumPoints / 25) * 100
    )
  );

  const satFatScore = Math.max(
    0,
    Math.round(
      100 -
      (saturatedFatPoints / 25) * 100
    )
  );

  const proteinScore = hasProtein
    ? Math.min(
        100,
        Math.round(
          (proteinPoints / 10) * 100
        )
      )
    : null;


  return {
    overallScore,
    grade,

    scoreStatus: "CALCULATED",
    scoreReason: null,

    rawINRScore,

    metricScores: {
      sugarScore,
      sodiumScore,
      proteinScore,
      satFatScore,
    },

    pointBreakdown: {
      negative: {
        energy: energyPoints,
        sugar: sugarPoints,
        saturatedFat: saturatedFatPoints,
        sodium: sodiumPoints,
        baseline: baselinePoints,
      },

      positive: {
        protein: proteinPoints,
        fibre: fibrePoints,
        total: positivePoints,
      },

      caps: {
        protein: proteinCap,
        fibre: fibreCap,
      },
    },
  };
}


// ============================================================
// 9. BARCODE vs OCR MISMATCH CHECK
//
// Kept compatible with your existing API.
// ============================================================

export function checkMismatch(
  barcodeValues,
  ocrValues
) {
  const fields = [];

  if (
    !barcodeValues ||
    !ocrValues
  ) {
    return {
      hasMismatch: false,
      severity: "none",
      fields: [],
    };
  }

  for (const key of Object.keys(barcodeValues)) {
    const a = barcodeValues[key];
    const b = ocrValues[key];

    if (
      !isValidNumber(a) ||
      !isValidNumber(b)
    ) {
      continue;
    }

    const diffPercent =
      (Math.abs(a - b) /
        Math.max(Math.abs(a), 1)) *
      100;

    if (diffPercent > 10) {
      fields.push({
        field: key,
        barcodeValue: a,
        ocrValue: b,
        differencePercent:
          Math.round(diffPercent * 10) / 10,
      });
    }
  }

  const severity =
    fields.some(
      (field) =>
        field.differencePercent > 20
    )
      ? "high"
      : fields.length
        ? "warning"
        : "none";

  return {
    hasMismatch: fields.length > 0,
    severity,
    fields,
  };
}