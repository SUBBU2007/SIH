export function parseNutrition(data) {
  const text = data.text || "";

  // Basic OCR cleanup
  const normalized = text
    .replace(/\r/g, "\n")
    .replace(/[¢©]/g, "g")
    .replace(/9(?=\s|$)/g, "g");

  // Ignore the later reference-information section.
  const nutritionSection = normalized.split(
    /Calories per gram/i
  )[0];

  function findNumber(patterns) {
    for (const pattern of patterns) {
      const match = nutritionSection.match(pattern);

      if (match) {
        return parseFloat(match[1]);
      }
    }

    return null;
  }

  const nutrition = {
    energy_kcal: findNumber([
      /Calories\s+(\d+(?:\.\d+)?)/i,
    ]),

    total_fat_g: findNumber([
      /Total\s+Fat\s+(\d+(?:\.\d+)?)\s*g?/i,
    ]),

    sat_fat_g: findNumber([
      /Saturated\s+Fat\s+(\d+(?:\.\d+)?)\s*g?/i,
    ]),

    trans_fat_g: findNumber([
      /Trans\s+Fat\s+(\d+(?:\.\d+)?)\s*g?/i,
    ]),

    sodium_mg: findNumber([
      /Sodium\s+(\d+(?:\.\d+)?)\s*mg/i,
    ]),

    carbohydrate_g: findNumber([
      /Total\s+Carbohydrate\s+(\d+(?:\.\d+)?)\s*g?/i,
    ]),

    fiber_g: findNumber([
      /Dietary\s+Fiber\s+(\d+(?:\.\d+)?)\s*g?/i,
    ]),

    sugar_g: findNumber([
      /Sugars?\s+(\d+(?:\.\d+)?)\s*g?/i,
    ]),

    protein_g: findNumber([
      /Protein\s+(\d+(?:\.\d+)?)\s*g?/i,
    ]),
  };

  return nutrition;
}