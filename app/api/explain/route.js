import { NextResponse } from "next/server";

export async function POST(req) {
  const { productName, overallScore, grade, nutritionPer100, whyThisResult } = await req.json();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `Product: ${productName}. Score: ${overallScore}/100 (${grade}). Per 100g — sugar: ${nutritionPer100.sugar_g}g, sodium: ${nutritionPer100.sodium_mg}mg, protein: ${nutritionPer100.protein_g}g, saturated fat: ${nutritionPer100.sat_fat_g}g. Rule-based findings: ${whyThisResult.join(" ")} Write one plain, neutral, factual sentence summarizing this for a shopper. No health advice, no "you should" language, no exclamation marks — just state what the numbers show.`,
        },
      ],
    }),
  });
  const data = await res.json();
  const text = data.content?.find((b) => b.type === "text")?.text ?? null;

  return NextResponse.json({ aiSummary: text });
}