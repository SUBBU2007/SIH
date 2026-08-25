import { NextResponse } from "next/server";

// Wraps Open Food Facts. No API key needed; send a descriptive User-Agent.
export async function GET(req, { params }) {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${params.code}.json`,
    { headers: { "User-Agent": "LabelSense - SIH2026 - contact@example.com" } }
  );
  const data = await res.json();

  if (data.status !== 1) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  const n = data.product.nutriments || {};
  return NextResponse.json({
    found: true,
    productName: data.product.product_name,
    nutritionPer100: {
      sugar_g: n["sugars_100g"] ?? null,
      sodium_mg: n["sodium_100g"] ? n["sodium_100g"] * 1000 : null,
      protein_g: n["proteins_100g"] ?? null,
      sat_fat_g: n["saturated-fat_100g"] ?? null,
      energy_kcal: n["energy-kcal_100g"] ?? null,
    },
  });
}
