import { NextResponse } from "next/server";

export async function POST(req) {
  const { products, priority } = await req.json();

  const summary = products.map((p) =>
    `${p.productName}: FoodScore ${p.scoreOutput.foodScore}, sugar ${p.nutritionPer100.sugar_g}g, sodium ${p.nutritionPer100.sodium_mg}mg, protein ${p.nutritionPer100.protein_g}g, sat fat ${p.nutritionPer100.sat_fat_g}g`
  ).join(". ");

  //const prompt = `Compare these products: ${summary}. The user cares most about: ${priority}. Write one plain, neutral, factual sentence naming which product comes out ahead on that priority and by roughly how much. No health advice, no "you should" language.`;
  const prompt = `Compare these snack products: ${summary}.IMPORTANT: For FoodScore, LOWER is better (fewer nutritional concerns). Do not assume higher is better.The user's selected priority: ${priority}.Write one or two plain, factual sentences that add insight beyond just restating the ranking — for example, point out a trade-off (e.g. one product wins on the chosen priority but is worse on a different nutrient than the others), or note if the products are close enough that the difference is marginal. No health advice, no "you should" language, be precise with the direction of "better" for FoodScore specifically.`;

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { thinkingConfig: { thinkingLevel: "MINIMAL" }, maxOutputTokens: 150 },
      }),
    }
  );
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  return NextResponse.json({ aiComparisonSummary: text });
}