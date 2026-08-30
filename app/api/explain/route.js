import { NextResponse } from "next/server";

export async function POST(req) {
  const { productName, overallScore, grade, nutritionPer100, whyThisResult } = await req.json();

  const prompt = `Product: ${productName}. Score: ${overallScore} (${grade}). Per 100g — sugar: ${nutritionPer100.sugar_g}g, sodium: ${nutritionPer100.sodium_mg}mg, protein: ${nutritionPer100.protein_g}g, saturated fat: ${nutritionPer100.sat_fat_g}g. Rule-based findings: ${whyThisResult.join(" ")} Write one plain, neutral, factual sentence summarizing this for a shopper. No health advice, no "you should" language, no exclamation marks — just state what the numbers show.`;

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //"X-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          thinkingConfig: { thinkingLevel: "MINIMAL" },
          maxOutputTokens: 200,
        },
      }),
    },
  );

  const data = await res.json();
  //console.log("Gemini raw response:", JSON.stringify(data, null, 2));
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

  return NextResponse.json({ aiSummary: text });
}