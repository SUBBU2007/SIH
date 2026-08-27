import { NextResponse } from "next/server";

// ---------------------------------------------------------
// Open Food Facts barcode lookup
// ---------------------------------------------------------

export async function GET(req, { params }) {
  try {
    const code = params.code;

    if (!code) {
      return NextResponse.json(
        {
          found: false,
          error: "Barcode is required.",
        },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
        code
      )}.json`,
      {
        headers: {
          "User-Agent":
            "LabelSense - SIH2026",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        {
          found: false,
        },
        { status: 404 }
      );
    }

    const data = await res.json();

    if (data.status !== 1) {
      return NextResponse.json(
        {
          found: false,
        },
        { status: 404 }
      );
    }

    const product = data.product || {};
    const n = product.nutriments || {};

    // -------------------------------------------------------
    // NUTRITION PER 100 g
    // -------------------------------------------------------

    const nutritionPer100 = {
      sugar_g:
        n["sugars_100g"] ?? null,

      sodium_mg:
        n["sodium_100g"] != null
          ? n["sodium_100g"] * 1000
          : null,

      protein_g:
        n["proteins_100g"] ?? null,

      sat_fat_g:
        n["saturated-fat_100g"] ?? null,

      energy_kcal:
        n["energy-kcal_100g"] ?? null,

      fiber_g:
        n["fiber_100g"] ??
        n["fibers_100g"] ??
        null,
    };

    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------

    return NextResponse.json({
      found: true,

      productName:
        product.product_name ||
        product.product_name_en ||
        "Unknown product",

      nutritionPer100,
    });
  } catch (error) {
    console.error(
      "Barcode lookup failed:",
      error
    );

    return NextResponse.json(
      {
        found: false,
        error:
          "Unable to lookup barcode.",
      },
      { status: 500 }
    );
  }
}